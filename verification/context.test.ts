import assert from 'node:assert/strict';
import {before,test} from 'node:test';
import type {Connection,Guidance,PickupSession,Report,ReportDetail,Zone,AssistanceRequest} from '../aqours-contracts/src/index.ts';
import {actors,connection,denied,key,ok,report,request,waterFixture} from './harness.ts';
let users:Awaited<ReturnType<typeof actors>>;
before(async()=>{users=await actors();});

test('pickup options use the owned report zone across multiple connections and reviewed alternate locations',async()=>{
  const {a,b,admin,staff}=users;
  const initial=await connection(a);
  const zoneB=(await ok<Zone[]>(staff,'GET','/staff/zones')).find(zone=>zone.active&&zone.id!==initial.zoneId)!;
  assert.ok(zoneB);
  const item=await report(a);
  await ok<Connection>(admin,'POST','/staff/settings/connections',{customerId:a.user.id,reference:`VERIFY-${key()}`,address:'Second fictional connection in another zone',zoneId:zoneB.id,zoneConfirmed:true});
  const pickupA=await waterFixture(admin,initial.zoneId!);
  const pickupB=await waterFixture(admin,zoneB.id);
  const options=await ok<PickupSession[]>(a,'GET',`/pickup-sessions?reportId=${item.id}&limit=100`);
  assert.ok(options.some(option=>option.id===pickupA.id));
  assert.ok(!options.some(option=>option.id===pickupB.id));
  const mismatched=await request(a,'POST','/assistance-requests',{reportId:item.id,type:'water_support',details:{requestedLiters:'10.00',sessionId:pickupB.id}},key());
  assert.equal(mismatched.status,400);
  const foreign=await report(b);
  await denied(a,'GET',`/pickup-sessions?reportId=${foreign.id}`);
  const zoneC=await ok<Zone>(admin,'POST','/staff/settings/zones',{code:`ALT-${key()}`,name:'Reviewed fictional alternate issue zone',demo:true});
  let alternate=await ok<Report>(a,'POST','/reports',{connectionId:initial.id,category:'outage',description:'Fictional alternate issue location',noticedAt:new Date().toISOString(),location:{address:'Other fictional site',source:'geocoded_address',confirmed:false}});
  alternate=await ok<Report>(staff,'PATCH',`/staff/reports/${alternate.id}`,{expectedVersion:alternate.version,zoneId:zoneC.id,zoneConfirmed:true,reason:'Staff explicitly reviewed alternate issue zone'});
  const pickupC=await waterFixture(admin,zoneC.id);
  const alternateOptions=await ok<PickupSession[]>(a,'GET',`/pickup-sessions?reportId=${alternate.id}&limit=100`);
  assert.ok(alternateOptions.some(option=>option.id===pickupC.id));
  assert.ok(alternateOptions.every(option=>option.zoneIds.includes(zoneC.id)));
  const guidance=await ok<Guidance>(a,'POST',`/reports/${alternate.id}/guidance`,{answers:{needsWater:true}});
  assert.ok(guidance.cards.some(card=>card.action==='water_support'&&card.sourceId===pickupC.id));
  const sent=await ok<AssistanceRequest>(a,'POST','/assistance-requests',{reportId:alternate.id,type:'water_support',details:{requestedLiters:'10.00',sessionId:pickupC.id}});
  assert.equal(sent.status,'requested');assert.equal(sent.allocation,null);
});

test('category-specific report details reach both customer and staff review without arbitrary answer projection',async()=>{
  const {a,b,staff}=users;
  const conn=await connection(a);
  const guided='Fictional leak is beside an exposed electrical cable; assessment requested.';
  const body={connectionId:conn.id,category:'leak',description:'Water flowing at the fictional site',noticedAt:new Date().toISOString(),answers:{details:guided}};
  const item=await ok<Report>(a,'POST','/reports',body);
  for(const actor of [a,staff]){
    const detail=await ok<ReportDetail>(actor,'GET',`${actor===staff?'/staff':''}/reports/${item.id}`);
    assert.equal(detail.guidedDetails,guided);
    assert.equal('answers' in detail,false);
  }
  await denied(b,'GET',`/reports/${item.id}`);
  const oversized=await request(a,'POST','/reports',{...body,answers:{details:'x'.repeat(2001)}},key());
  assert.equal(oversized.status,400);
});

test('confirmed GPS retains measured accuracy and requires separate supplier zone review',async()=>{
  const {a,staff}=users,conn=await connection(a);
  const location={address:'Fictional GPS issue point',source:'gps',confirmed:true,latitude:14.575,longitude:121.045,accuracy:5.25};
  const body={connectionId:conn.id,category:'outage',description:'Fictional measured GPS fixture',noticedAt:new Date().toISOString(),location};
  const item=await ok<Report>(a,'POST','/reports',body);
  for(const actor of [a,staff]){
    const detail=await ok<ReportDetail>(actor,'GET',`${actor===staff?'/staff':''}/reports/${item.id}`);
    assert.equal(detail.accuracy,5.25);assert.equal(detail.locationSource,'gps');
    assert.equal(detail.latitude,14.575);assert.equal(detail.longitude,121.045);
    assert.equal(detail.locationConfirmed,true);assert.equal(detail.zoneId,null);
    assert.equal(detail.zoneConfirmed,false);assert.equal(detail.locationReview,true);
  }
  assert.deepEqual(await connection(a),conn);
  const reviewed=await ok<Report>(staff,'PATCH',`/staff/reports/${item.id}`,{
    expectedVersion:item.version,zoneId:conn.zoneId,zoneConfirmed:true,reason:'Supplier separately reviewed issue connectivity',
  });
  assert.equal(reviewed.locationReview,false);assert.equal(reviewed.accuracy,5.25);
  const invalid=await request(a,'POST','/reports',{...body,location:{...location,accuracy:-1}},key());
  assert.equal(invalid.status,400);
});
