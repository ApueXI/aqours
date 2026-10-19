import assert from 'node:assert/strict';
import { before,test } from 'node:test';
import type {Advisory,Guidance,Notification,Report,StaffIncident,AssistanceRequest} from '../aqours-contracts/src/index.ts';
import {actors,connection,denied,key,ok,report,request} from './harness.ts';
let users:Awaited<ReturnType<typeof actors>>;
before(async()=>{users=await actors();});
async function draft(kind='do_not_drink'){
  const ca=await connection(users.a);
  return ok<Advisory>(users.admin,'POST','/staff/advisories',{kind,title:`Fictional ${kind} integration notice`,text:'DEMONSTRATION ONLY: supplier-provided approved notice fixture. Contact supplier for actual instructions.',source:'Fictional supplier approval for software demonstration',zoneIds:[],connectionIds:[ca.id],startsAt:new Date(Date.now()-86400000).toISOString(),endsAt:new Date(Date.now()-3600000).toISOString(),demo:true});
}

test('DEMO-004: quality restrictions are distinct, independently published and persist past end or outage resolution',async()=>{
  const {a,staff,admin}=users;
  const restrictions:Advisory[]=[];
  for(const kind of ['boil_water','do_not_drink','do_not_use']){
    const notice=await draft(kind);
    await denied(staff,'POST',`/staff/advisories/${notice.id}/publish`,{expectedVersion:notice.version});
    await denied(a,'GET',`/advisories/${notice.id}`);
    const published=await ok<Advisory>(admin,'POST',`/staff/advisories/${notice.id}/publish`,{expectedVersion:notice.version});
    restrictions.push(published);
  }
  const current=await ok<Advisory[]>(a,'GET','/advisories?limit=100');
  for(const notice of restrictions) assert.equal(current.find(n=>n.id===notice.id)?.kind,notice.kind);
  let incident=await ok<StaffIncident>(staff,'POST','/staff/incidents',{category:'outage',summary:'Synthetic incident independence',zoneIds:[(await connection(a)).zoneId],area:'Fictional zone',demo:true});
  for(const status of ['confirmed','work_in_progress','monitoring','resolved']){
    incident=await ok<StaffIncident>(staff,'PATCH',`/staff/incidents/${incident.id}`,{expectedVersion:incident.version,status,reason:'Reviewed incident progression'});
  }
  assert.ok((await ok<Advisory[]>(a,'GET','/advisories?limit=100')).some(n=>n.id===restrictions[0].id));
  const before=restrictions[0];
  await denied(staff,'POST',`/staff/advisories/${before.id}/lift`,{expectedVersion:before.version,reason:'Unauthorized lifting attempt'});
  const lifted=await ok<Advisory>(admin,'POST',`/staff/advisories/${before.id}/lift`,{expectedVersion:before.version,reason:'Explicit fictional authorized lift'});
  assert.equal(lifted.state,'lifted');
  assert.ok(lifted.liftedAt);
  assert.ok(!(await ok<Advisory[]>(a,'GET','/advisories?limit=100')).some(n=>n.id===before.id));
  assert.equal((await ok<Advisory>(a,'GET',`/advisories/${before.id}`)).state,'lifted');
});

test('area notice audiences need no report and publication/read retries never duplicate notifications',async()=>{
  const {a,b,admin}=users;
  const notice=await draft();
  const operation=key(),body={expectedVersion:notice.version};
  const published=await ok<Advisory>(admin,'POST',`/staff/advisories/${notice.id}/publish`,body,operation);
  const replay=await ok<Advisory>(admin,'POST',`/staff/advisories/${notice.id}/publish`,body,operation);
  assert.equal(replay.version,published.version);
  for(let i=0;i<3;i++){
    const list=await ok<Notification[]>(a,'GET','/notifications?limit=100');
    const matching=list.filter(n=>n.targetId===notice.id);
    assert.equal(matching.length,1);
    await ok(a,'PATCH',`/notifications/${matching[0].id}/read`,{});
  }
  assert.equal((await ok<Notification[]>(b,'GET','/notifications?limit=100')).filter(n=>n.targetId===notice.id).length,0);
});

test('DEMO-003: rules retain evidence, apply safety precedence and choices never create assistance',async()=>{
  const {a,b}=users;
  const item=await report(a,'water_quality');
  const before=await ok<AssistanceRequest[]>(a,'GET','/assistance-requests?limit=100');
  const guide=await ok<Guidance>(a,'POST',`/reports/${item.id}/guidance`,{answers:{hazard:true,needsWater:true}});
  assert.ok(guide.ruleVersion>=1);
  assert.ok(guide.sourceSignature);
  assert.equal(guide.current,true);
  assert.equal(guide.cards[0].action,'notice');
  assert.ok(guide.cards.some(c=>c.action==='escalation'));
  assert.ok(guide.cards.every(c=>c.reason&&c.source&&c.updatedAt));
  assert.ok(!JSON.stringify(guide).includes('notes'));
  await denied(b,'GET',`/guidance/${guide.id}`);
  await ok(a,'POST',`/guidance/${guide.id}/choice`,{action:'decline'});
  await ok(a,'POST',`/guidance/${guide.id}/choice`,{action:'inspection'});
  assert.equal((await ok<AssistanceRequest[]>(a,'GET','/assistance-requests?limit=100')).length,before.length);
});

test('guidance source revisions invalidate history and current evaluation includes the latest source',async()=>{
  const {a,admin}=users;
  const item=await report(a,'low_pressure');
  const old=await ok<Guidance>(a,'POST',`/reports/${item.id}/guidance`,{answers:{persistent:true}});
  const rule=await ok<{version:number}>(admin,'POST','/staff/settings/rules',{contactText:'Contact the fictional supplier for confirmation.',inspectionText:'Request assessment from supplier staff.',waterText:'Request listed pickup; staff must confirm stock.'});
  assert.ok(rule.version>old.ruleVersion);
  const historical=await ok<Guidance>(a,'GET',`/guidance/${old.id}`);
  assert.equal(historical.current,false);
  const fresh=await ok<Guidance>(a,'POST',`/reports/${item.id}/guidance`,{answers:{persistent:true}});
  assert.equal(fresh.current,true);
  assert.equal(fresh.ruleVersion,rule.version);
  assert.notEqual(fresh.sourceSignature,old.sourceSignature);
  assert.ok(fresh.cards.some(c=>c.action==='inspection'));
});

test('unconfirmed zones remain uncertain, failed/missing geocoder configuration returns honest error',async()=>{
  const {a}=users;
  const conn=await connection(a);
  const item=await ok<Report>(a,'POST','/reports',{connectionId:conn.id,category:'outage',description:'Unconfirmed location fixture',noticedAt:new Date().toISOString(),location:{address:'Unknown fictional road',source:'geocoded_address',confirmed:false}});
  const guide=await ok<Guidance>(a,'POST',`/reports/${item.id}/guidance`,{answers:{}});
  assert.ok(guide.uncertainty.length>0);
  assert.ok(guide.cards.some(c=>c.action==='callback'));
  const missing=await request(a,'POST','/locations/geocode',{address:'Fictional test location'});
  assert.ok([200,503].includes(missing.status));
  if(missing.status===503) assert.ok(missing.body.error?.message);
  const fabricated=await request(a,'POST','/reports',{connectionId:conn.id,category:'leak',description:'Invalid signed candidate test',noticedAt:new Date().toISOString(),location:{address:'Invented',source:'geocoded_address',confirmed:true,latitude:14.5,longitude:121.0,candidateToken:'forged'}},key());
  assert.equal(fabricated.status,400);
});
