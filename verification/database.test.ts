import assert from 'node:assert/strict';
import { before,test } from 'node:test';
import { createHash,randomUUID } from 'node:crypto';
import type {AssistanceRequest,StaffIncident,Report,Metrics} from '../aqours-contracts/src/index.ts';
import {actors,base,connection,denied,key,login,ok,report,request,waterFixture,waterRequest} from './harness.ts';
import {databaseSQL} from './database-client.ts';
let users:Awaited<ReturnType<typeof actors>>;
before(async()=>{users=await actors();});
const database=process.env.AQOURS_TEST_DATABASE_URL??'postgresql://cred@127.0.0.1:55432/aqours_test';
function sql(query:string):string{
  return databaseSQL(query,database);
}
function identifier(value:string):string{assert.match(value,/^[0-9a-f-]{36}$/i);return value;}
function rejectNotification(target:string){
  const name='aqours_verify_'+randomUUID().replaceAll('-','');
  sql(`CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.data->>'targetId'='${identifier(target)}' THEN RAISE EXCEPTION 'Injected verification fault'; END IF; RETURN NEW; END $$; CREATE TRIGGER ${name} BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION ${name}();`);
  return()=>sql(`DROP TRIGGER ${name} ON notifications; DROP FUNCTION ${name}();`);
}

test('database command failures never expose a private connection URL in reported errors',()=>{
  const fictional='postgresql://fictional:private-fixture-value@127.0.0.1:1/aqours_failure_test';
  assert.throws(()=>databaseSQL('SELECT 1',fictional),error=>{
    assert.ok(error instanceof Error);
    assert.ok(!String(error).includes('private-fixture-value'));
    assert.ok(!String(error).includes('postgresql:'));
    assert.equal('cause' in error,false);
    return true;
  });
});

test('stock acceptance rollback preserves request, allocation, history, notification and operation atomicity',async()=>{
  const {a,admin,staff}=users;
  const session=await waterFixture(admin,(await connection(a)).zoneId!);
  const item=await waterRequest(a,session,'60.00');
  const operation=key(),body={expectedVersion:item.version,status:'accepted',ownerId:staff.user.id};
  const count=sql(`SELECT count(*) FROM events WHERE target_id='${identifier(item.id)}'`);
  const cleanup=rejectNotification(item.id);
  try{
    const failed=await request(staff,'POST',`/staff/assistance-requests/${item.id}/transition`,body,operation);
    assert.equal(failed.status,500);
    assert.equal(sql(`SELECT count(*) FROM allocations WHERE request_id='${item.id}'`),'0');
    assert.equal(sql(`SELECT count(*) FROM operations WHERE key='${operation}'`),'0');
    assert.equal(sql(`SELECT count(*) FROM events WHERE target_id='${item.id}'`),count);
    assert.equal((await ok<AssistanceRequest>(a,'GET',`/assistance-requests/${item.id}`)).status,'requested');
  }finally{cleanup();}
  const accepted=await ok<AssistanceRequest>(staff,'POST',`/staff/assistance-requests/${item.id}/transition`,body,operation);
  assert.equal(accepted.status,'accepted');assert.ok(accepted.allocation?.reference);
  assert.throws(()=>sql(`UPDATE stock_sessions SET total=59.99 WHERE id='${identifier(session.id)}'`));
});

test('publication failure rolls back both incident update and all notification work; same key then succeeds',async()=>{
  const {a,staff}=users;
  let item=await report(a);
  const incident=await ok<StaffIncident>(staff,'POST','/staff/incidents',{category:'outage',summary:'Fault-injection demo publication',zoneIds:[(await connection(a)).zoneId],area:'Fictional zone',demo:true});
  item=await ok<Report>(staff,'POST',`/staff/reports/${item.id}/link`,{expectedVersion:item.version,incidentId:incident.id,reason:'Staff confirmed association'});
  const operation=key(),body={expectedVersion:incident.version,progress:'Fictional publication with atomic notifications',area:'Fictional zone',restorationAt:null};
  const cleanup=rejectNotification(incident.id);
  try{
    const failed=await request(staff,'POST',`/staff/incidents/${incident.id}/updates`,body,operation);
    assert.equal(failed.status,500);
    assert.equal(sql(`SELECT count(*) FROM records WHERE kind='incident_update' AND parent_id='${identifier(incident.id)}'`),'0');
    assert.equal(sql(`SELECT count(*) FROM operations WHERE key='${operation}'`),'0');
    await denied(a,'GET',`/incidents/${incident.id}`);
  }finally{cleanup();}
  await ok(staff,'POST',`/staff/incidents/${incident.id}/updates`,body,operation);
  assert.equal(sql(`SELECT count(*) FROM records WHERE kind='incident_update' AND parent_id='${incident.id}'`),'1');
});

test('expired database sessions are denied and no-cookie hostile browser logout is rejected',async()=>{
  const actor=await login('customer04@demo.aqours.test');
  const companion=await login('customer04@demo.aqours.test');
  const digest=createHash('sha256').update(actor.token!).digest('hex');
  sql(`UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash='${digest}' AND user_id='${identifier(actor.user.id)}'`);
  await denied(actor,'GET','/me');
  assert.equal((await ok<{id:string}>(companion,'GET','/me')).id,actor.user.id);
  await ok(companion,'POST','/auth/logout',{});
  const response=await fetch(base+'/auth/logout',{method:'POST',headers:{Origin:'https://hostile.example','Content-Type':'application/json'},body:'{}'});
  assert.equal(response.status,403);
});

test('null zone review and invalid filters cannot silently become confirmed or valid empty results',async()=>{
  const {a,staff}=users;
  const item=await report(a);
  for(const patch of [{zoneId:null},{zoneId:null,zoneConfirmed:true}]){
    const invalid=await request(staff,'PATCH',`/staff/reports/${item.id}`,{expectedVersion:item.version,reason:'Invalid cleared-zone review',...patch},key());
    assert.equal(invalid.status,400);
  }
  for(const path of ['/staff/reports?category=invented','/staff/map/reports?west=120&south=10&east=125&north=15&status=invented','/assistance-requests?type=invented']){
    assert.equal((await request(path.startsWith('/staff')?staff:a,'GET',path)).status,400);
  }
});

test('historic genuine resolution and later reviewed closure form disjoint metric cohorts',async()=>{
  const {a,staff}=users;
  let item=await report(a);
  for(const status of ['under_review','in_progress','resolved'])item=await ok<Report>(staff,'PATCH',`/staff/reports/${item.id}`,{expectedVersion:item.version,status,reason:'Reviewed progression',...(status==='resolved'?{closureOutcome:'restored'}:{})});
  item=await ok<Report>(a,'POST',`/reports/${item.id}/still-affected`,{expectedVersion:item.version,reason:'Individual follow-up'});
  await ok(staff,'PATCH',`/staff/reports/${item.id}`,{expectedVersion:item.version,status:'resolved',closureOutcome:'duplicate',reason:'Reviewed follow-up duplicate retains real prior resolution'});
  const metric=await ok<Metrics>(staff,'GET','/staff/metrics');
  assert.ok(metric.firstResolution.pendingCount>=0);
  assert.equal(metric.firstResolution.sampleCount+metric.firstResolution.excludedCount+metric.firstResolution.pendingCount,metric.reportCount);
});


test('inactive draft targets cannot publish and guidance evidence remains immutable and private',async()=>{
  const {a,admin}=users;
  const zone=await ok<{id:string;version:number}>(admin,'POST','/staff/settings/zones',{code:`VERIFY-${key()}`,name:'Fictional draft-only zone',demo:true});
  const draft=await ok<{id:string;version:number}>(admin,'POST','/staff/advisories',{kind:'general',title:'Fictional inactive target',text:'Demo notice for target validation',source:'Fictional supplier',zoneIds:[zone.id],demo:true});
  await ok(admin,'PATCH',`/staff/settings/zones/${zone.id}`,{expectedVersion:zone.version,active:false,reason:'Reviewed zone retirement before draft publication'});
  const invalid=await request(admin,'POST',`/staff/advisories/${draft.id}/publish`,{expectedVersion:draft.version},key());
  assert.ok([400,409].includes(invalid.status));
  const item=await report(a);
  const guide=await ok<{id:string}>(a,'POST',`/reports/${item.id}/guidance`,{answers:{needsWater:true}});
  assert.equal(sql(`SELECT (data ? 'evidence' AND data ? 'answers') FROM records WHERE id='${identifier(guide.id)}'`),'t');
  assert.throws(()=>sql(`UPDATE records SET data=data WHERE id='${guide.id}'`));
  const publicGuide=await ok<Record<string,unknown>>(a,'GET',`/guidance/${guide.id}`);
  assert.equal('evidence' in publicGuide,false);assert.equal('answers' in publicGuide,false);
  assert.throws(()=>sql(`INSERT INTO stock_sessions(id,total) VALUES('${identifier(item.id)}',100)`));
});
