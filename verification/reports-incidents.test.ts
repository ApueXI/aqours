import assert from 'node:assert/strict';
import {before,test} from 'node:test';
import type {Report,ReportDetail,StaffIncident,PublishedIncident,Notification,Message,MapResponse} from '../aqours-contracts/src/index.ts';
import {actors,connection,key,ok,report,request} from './harness.ts';
let users:Awaited<ReturnType<typeof actors>>;
before(async()=>{users=await actors();});

test('DEMO-001/010: concurrent same-key report submissions commit one result and reject changed payload',async()=>{
  const {a}=users;
  const input={connectionId:(await connection(a)).id,category:'water_quality',description:'Demonstration only: unusual appearance',noticedAt:new Date().toISOString()};
  const operation=key();
  const results=await Promise.all(Array.from({length:5},()=>request<Report>(a,'POST','/reports',input,operation)));
  assert.ok(results.every(x=>[200,201].includes(x.status)),JSON.stringify(results.map(x=>x.body)));
  assert.equal(new Set(results.map(x=>x.data.id)).size,1);
  const changed=await request(a,'POST','/reports',{...input,description:'Different intention'},operation);
  assert.equal(changed.status,409);
  assert.equal(results[0].data.status,'received');
  assert.ok(results[0].data.reference);
  assert.ok(Date.parse(results[0].data.submittedAt));
});

test('DEMO-002/005: shared incident links, publication dedupe, private snapshots and individual follow-up',async()=>{
  const {a,b,staff}=users;
  let ra=await report(a), rb=await report(b);
  const ca=await connection(a),cb=await connection(b);
  let incident=await ok<StaffIncident>(staff,'POST','/staff/incidents',{category:'outage',summary:'Integration synthetic shared outage',zoneIds:[...new Set([ca.zoneId,cb.zoneId].filter(Boolean))],area:'Demonstration areas',restorationAt:null,demo:true});
  ra=await ok<Report>(staff,'POST',`/staff/reports/${ra.id}/link`,{expectedVersion:ra.version,incidentId:incident.id,reason:'Reviewed category/time/zone context'});
  rb=await ok<Report>(staff,'POST',`/staff/reports/${rb.id}/link`,{expectedVersion:rb.version,incidentId:incident.id,reason:'Staff confirmed related report'});
  await ok(staff,'POST',`/staff/incidents/${incident.id}/notes`,{text:'INCIDENT PRIVATE NOTE'});
  incident=await ok<StaffIncident>(staff,'GET',`/staff/incidents/${incident.id}`);
  const publication={expectedVersion:incident.version,progress:'Demonstration crew investigation; estimate unknown',area:'Fictional service zones',restorationAt:null};
  const operation=key();
  const published=await ok<{id:string}>(staff,'POST',`/staff/incidents/${incident.id}/updates`,publication,operation);
  const replay=await ok<{id:string}>(staff,'POST',`/staff/incidents/${incident.id}/updates`,publication,operation);
  assert.equal(replay.id,published.id);
  for(const actor of [a,b]){
    const notices=await ok<Notification[]>(actor,'GET','/notifications?limit=100');
    assert.equal(notices.filter(n=>n.targetId===incident.id).length,1);
    const own=await ok<ReportDetail>(actor,'GET',`/reports/${actor===a?ra.id:rb.id}`);
    assert.equal(own.incident?.id,incident.id);
    assert.ok(!JSON.stringify(own).includes('INCIDENT PRIVATE NOTE'));
  }
  const safe=await ok<PublishedIncident>(a,'GET',`/incidents/${incident.id}`);
  assert.equal(safe.latestUpdate.restorationAt,null);
  assert.ok(!('reports' in safe));
  assert.ok(!('notes' in safe));
  const detail=await ok<StaffIncident>(staff,'GET',`/staff/incidents/${incident.id}`);
  assert.equal(detail.reportCount,2);
  assert.equal(detail.uniqueConnections,2);
  assert.equal(detail.estimatedAffected,null);
  for(const status of ['under_review','in_progress','resolved']){
    ra=await ok<Report>(staff,'PATCH',`/staff/reports/${ra.id}`,{expectedVersion:ra.version,status,reason:'Reviewed operational progression',...(status==='resolved'?{closureOutcome:'restored'}:{})});
  }
  const firstResolution=ra.firstResolvedAt;
  const followup=await ok<Report>(a,'POST',`/reports/${ra.id}/still-affected`,{expectedVersion:ra.version,reason:'Service issue persists at this connection'});
  assert.equal(followup.status,'under_review');
  assert.equal(followup.firstResolvedAt,firstResolution);
  assert.equal((await ok<Report>(b,'GET',`/reports/${rb.id}`)).status,rb.status);
  assert.equal((await ok<StaffIncident>(staff,'GET',`/staff/incidents/${incident.id}`)).status,'investigating');
});

test('review operations require reasons, prevent stale overwrite, separate clarification and staff notes',async()=>{
  const {a,staff}=users;
  let item=await ok<Report>(a,'POST','/reports',{
    connectionId:(await connection(a)).id,category:'leak',description:'Fictional isolated unlocated severe leak',noticedAt:new Date().toISOString(),
    location:{address:'Fictional address awaiting location review',source:'geocoded_address',confirmed:false},
  });
  assert.equal(item.latitude,null);assert.equal(item.longitude,null);assert.equal(item.zoneId,null);
  const missingReason=await request(staff,'PATCH',`/staff/reports/${item.id}`,{expectedVersion:item.version,priority:'urgent'},key());
  assert.equal(missingReason.status,400);
  const originalVersion=item.version;
  const beforeReview=Date.now();
  item=await ok<Report>(staff,'PATCH',`/staff/reports/${item.id}`,{expectedVersion:item.version,priority:'urgent',reason:'Isolated hazardous leak needs assessment',ownerId:staff.user.id});
  const afterReview=Date.now();
  assert.equal(item.priority,'urgent');
  assert.equal(item.ownerId,staff.user.id);
  assert.equal(item.latitude,null);assert.equal(item.longitude,null);assert.equal(item.zoneId,null);
  const privateNote=`Private report review note ${key()}`;
  await ok(staff,'POST',`/staff/reports/${item.id}/notes`,{text:privateNote});
  const reviewed=await ok<ReportDetail>(staff,'GET',`/staff/reports/${item.id}`);
  const audit=reviewed.timeline.find(event=>event.action==='reviewed'&&event.text==='Isolated hazardous leak needs assessment');
  assert.ok(audit);assert.equal(audit.actorId,staff.user.id);
  assert.ok(Date.parse(audit.createdAt)>=beforeReview&&Date.parse(audit.createdAt)<=afterReview);
  assert.equal((await ok<ReportDetail>(a,'GET',`/reports/${item.id}`)).firstRespondedAt,null);
  const stale=await request(staff,'PATCH',`/staff/reports/${item.id}`,{expectedVersion:originalVersion,status:'under_review',reason:'Stale edit'},key());
  assert.equal(stale.status,409);
  const messageKey=key();
  const text={text:'Please clarify the observed leak location.'};
  const msg=await ok<Message>(staff,'POST',`/staff/reports/${item.id}/messages`,text,messageKey);
  assert.equal((await ok<Message>(staff,'POST',`/staff/reports/${item.id}/messages`,text,messageKey)).id,msg.id);
  await ok(a,'POST',`/reports/${item.id}/messages`,{text:'At the fictional community gate.'});
  const detail=await ok<ReportDetail>(a,'GET',`/reports/${item.id}`);
  assert.ok(detail.firstRespondedAt);
  assert.equal(detail.messages.filter(x=>x.id===msg.id).length,1);
  assert.ok(!JSON.stringify(detail).includes(privateNote));
});

test('map queries enforce bounds, cap disclosure and persisted point ordering without invented coordinates',async()=>{
  const {a,staff}=users;
  const item=await report(a);
  const ca=await connection(a);
  const mapped=await ok<MapResponse>(staff,'GET','/staff/map/reports?west=-180&south=-90&east=180&north=90&limit=1');
  assert.equal(mapped.limit,1);
  assert.ok(mapped.features.length<=1);
  assert.equal(typeof mapped.truncated,'boolean');
  const all=await ok<MapResponse>(staff,'GET','/staff/map/reports?west=-180&south=-90&east=180&north=90&limit=1000');
  const point=all.features.find(f=>f.properties.id===item.id);
  if(ca.latitude!==null&&ca.longitude!==null) assert.deepEqual(point?.geometry.coordinates,[ca.longitude,ca.latitude]);
  assert.ok(all.features.every(f=>Number.isFinite(f.geometry.coordinates[0])&&Number.isFinite(f.geometry.coordinates[1])));
  const invalid=await request(staff,'GET','/staff/map/reports?west=200&south=0&east=10&north=15');
  assert.equal(invalid.status,400);
  const nan=await request(staff,'GET','/staff/map/reports?west=NaN&south=0&east=125&north=15');
  assert.equal(nan.status,400);
});
