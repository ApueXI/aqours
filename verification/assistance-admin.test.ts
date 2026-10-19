import assert from 'node:assert/strict';
import {before,test} from 'node:test';
import type {AssistanceRequest,Connection,User,Report,ReportDetail,Metrics,Zone} from '../aqours-contracts/src/index.ts';
import {actors,connection,denied,key,login,ok,report,request,transition} from './harness.ts';
let users:Awaited<ReturnType<typeof actors>>;
before(async()=>{users=await actors();});

test('DEMO-008: callback and inspection lifecycles retain details, appointments, outcomes and independent report status',async()=>{
  const {a,staff}=users;
  for(const type of ['callback','inspection'] as const){
    const item=await report(a,type==='inspection'?'leak':'outage');
    const details=type==='callback'?{question:'Fictional support question',contactMethod:'phone',contactNumber:'09000000001',preferredWindow:'Morning'}:{issueDetails:'Fictional leak assessment',siteAddress:'Alternate fictional inspection address',preferredWindow:'Afternoon',accessInstructions:'Meet at community gate'};
    let service=await ok<AssistanceRequest>(a,'POST','/assistance-requests',{reportId:item.id,type,details});
    assert.equal(service.status,'requested');assert.equal(service.appointmentAt,null);
    const duplicate=await request(a,'POST','/assistance-requests',{reportId:item.id,type,details},key());
    assert.equal(duplicate.status,409);
    service=await transition(staff,service,'accepted',{ownerId:staff.user.id});
    assert.equal(service.ownerId,staff.user.id);
    service=await transition(staff,service,'scheduled',{appointmentAt:new Date(Date.now()+3600000).toISOString()});
    const firstAppointment=service.appointmentAt;
    service=await transition(staff,service,'scheduled',{appointmentAt:new Date(Date.now()+7200000).toISOString(),reason:'Customer requested a later appointment'});
    assert.notEqual(service.appointmentAt,firstAppointment);
    assert.ok(service.timeline?.length);
    service=await transition(staff,service,'in_progress');
    const late=await request(a,'POST',`/assistance-requests/${service.id}/cancel`,{expectedVersion:service.version,reason:'Too late'},key());
    assert.equal(late.status,409);
    service=await transition(staff,service,'completed',{outcome:type==='inspection'?'Recorded fictional assessment findings':'Recorded fictional contact outcome',nextSteps:'Staff will separately review the report'});
    assert.equal(service.status,'completed');
    assert.ok(service.outcome);assert.ok(service.nextSteps);
    assert.equal((await ok<Report>(a,'GET',`/reports/${item.id}`)).status,'received');
    if(type==='inspection') assert.equal(service.details.siteAddress,'Alternate fictional inspection address');
  }
});

test('immediate support needs reason; unavailable/reschedule/cancel preserve coherent timeline',async()=>{
  const {a,staff}=users;
  const item=await report(a);
  let service=await ok<AssistanceRequest>(a,'POST','/assistance-requests',{reportId:item.id,type:'callback',details:{question:'Immediate support fixture',contactMethod:'phone',contactNumber:'09000000001',preferredWindow:'Now'}});
  service=await transition(staff,service,'accepted',{ownerId:staff.user.id});
  const missing=await request(staff,'POST',`/staff/assistance-requests/${service.id}/transition`,{expectedVersion:service.version,status:'in_progress'},key());
  assert.equal(missing.status,400);
  service=await transition(staff,service,'in_progress',{reason:'Customer available for immediate callback'});
  service=await transition(staff,service,'scheduled',{reason:'Missed callback; agreed later time',appointmentAt:new Date(Date.now()+3600000).toISOString()});
  assert.equal(service.status,'scheduled');
  const version=service.version;
  const forbiddenCancellation=await request(a,'POST',`/assistance-requests/${service.id}/cancel`,{expectedVersion:version,reason:'Work already began before reschedule'},key());
  assert.equal(forbiddenCancellation.status,409);
  service=await transition(staff,service,'unavailable',{reason:'Missed callback; supplier follow-up required'});
  assert.equal(service.status,'unavailable');
  const stale=await request(staff,'POST',`/staff/assistance-requests/${service.id}/transition`,{expectedVersion:version,status:'in_progress',reason:'Stale cached action'},key());
  assert.equal(stale.status,409);
});

test('administration validates roles/login uniqueness, revokes deactivated sessions and retains ownership',async()=>{
  const {admin,staff,a}=users;
  await denied(staff,'GET','/staff/settings/accounts');
  await denied(a,'POST','/staff/settings/zones',{code:'BAD',name:'Denied'});
  const email=`fixture-${key()}@demo.aqours.test`;
  let account=await ok<User>(admin,'POST','/staff/settings/accounts',{email,name:'Fictional verification customer',password:'DemoWater2026!',role:'customer'});
  assert.ok(!JSON.stringify(account).includes('password'));
  const duplicate=await request(admin,'POST','/staff/settings/accounts',{email:email.toUpperCase(),name:'Duplicate login',password:'DemoWater2026!',role:'customer'},key());
  assert.equal(duplicate.status,409);
  const zone=(await ok<Zone[]>(admin,'GET','/staff/settings/zones')).find(candidate=>candidate.active);
  assert.ok(zone,'A seeded active service zone is required');
  const conn=await ok<Connection>(admin,'POST','/staff/settings/connections',{customerId:account.id,reference:`DEMO-${key()}`,address:'Fictional test connection',zoneId:zone.id,zoneConfirmed:true,latitude:14.6,longitude:121.0});
  const actor=await login(email);
  const own=await report(actor);
  assert.equal(own.connectionId,conn.id);
  account=await ok<User>(admin,'PATCH',`/staff/settings/accounts/${account.id}`,{expectedVersion:account.version,active:false,reason:'Demo deactivation verification'});
  assert.equal(account.active,false);
  await denied(actor,'GET','/me');
  assert.equal((await ok<ReportDetail>(admin,'GET',`/staff/reports/${own.id}`)).customerId,account.id);
  const invalidRole=await request(admin,'POST','/staff/settings/accounts',{email:`bad-${key()}@demo.aqours.test`,name:'Invalid role',password:'DemoWater2026!',role:'superadmin'},key());
  assert.equal(invalidRole.status,400);
});

test('reviewed zone changes are audited and never move historical report snapshots',async()=>{
  const {a,admin,staff}=users;
  const conn=await connection(a), item=await report(a);
  const updated=await ok<Connection>(admin,'PATCH',`/staff/settings/connections/${conn.id}`,{expectedVersion:conn.version,address:'Changed fictional saved address',latitude:14.7,longitude:121.1,reason:'Reviewed saved-location correction'});
  assert.equal(updated.address,'Changed fictional saved address');
  const historic=await ok<Report>(a,'GET',`/reports/${item.id}`);
  assert.equal(historic.address,item.address);
  assert.equal(historic.latitude,item.latitude);
  const audit=await ok<unknown[]>(admin,'GET','/staff/audit?limit=100');
  assert.ok(audit.length>0);
  await denied(staff,'POST','/staff/settings/rules',{contactText:'Denied',inspectionText:'Denied',waterText:'Denied'});
});

test('metric events exclude internal notes and reviewed invalid/duplicate closures and preserve prior resolution',async()=>{
  const {a,staff}=users;
  let item=await report(a,'low_pressure');
  await ok(staff,'POST',`/staff/reports/${item.id}/notes`,{text:'Internal note is not a first response'});
  assert.equal((await ok<Report>(a,'GET',`/reports/${item.id}`)).firstRespondedAt,null);
  await ok(staff,'POST',`/staff/reports/${item.id}/messages`,{text:'Staff acknowledgment defines first response'});
  item=await ok<Report>(staff,'GET',`/staff/reports/${item.id}`);
  assert.ok(item.firstRespondedAt);
  const duplicate=await report(a,'low_pressure');
  const closed=await ok<Report>(staff,'PATCH',`/staff/reports/${duplicate.id}`,{expectedVersion:duplicate.version,status:'resolved',closureOutcome:'duplicate',reason:'Staff reviewed separate issue already tracked'});
  assert.equal(closed.firstResolvedAt,null);
  const metrics=await ok<Metrics>(staff,'GET','/staff/metrics');
  assert.ok(metrics.reviewedClosures>=1);
  assert.ok(metrics.firstResponse.sampleCount>=1);
  assert.ok(metrics.firstResolution.excludedCount>=1);
  assert.equal(metrics.timezone,'Asia/Manila');
  assert.ok(metrics.from&&metrics.to&&metrics.asOf&&metrics.cohort);
  const invalidPeriod=await request(staff,'GET','/staff/metrics?from=2026-10-19T00:00:00Z&to=2026-10-18T00:00:00Z');
  assert.equal(invalidPeriod.status,400);
});
