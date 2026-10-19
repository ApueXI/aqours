import assert from 'node:assert/strict';
import { before,test } from 'node:test';
import type {AssistanceRequest,PickupSession,Notification} from '../aqours-contracts/src/index.ts';
import {actors,connection,key,ok,request,transition,waterFixture,waterRequest} from './harness.ts';
let users:Awaited<ReturnType<typeof actors>>;
before(async()=>{users=await actors();});
async function session(id:string){return (await ok<PickupSession[]>(users.staff,'GET','/staff/distribution/sessions?limit=100')).find(x=>x.id===id)!;}

test('DEMO-009: concurrent 80-liter approvals against 100 liters accept at most one',async()=>{
  const {a,b,admin,staff}=users;
  const pickup=await waterFixture(admin,(await connection(a)).zoneId!);
  const first=await waterRequest(a,pickup,'80.00');
  // Use same customer's second report if the other connection belongs to a different zone.
  const second=await waterRequest(a,pickup,'80.00');
  const results=await Promise.all([first,second].map(item=>request<AssistanceRequest>(staff,'POST',`/staff/assistance-requests/${item.id}/transition`,{expectedVersion:item.version,status:'accepted',ownerId:staff.user.id},key())));
  assert.equal(results.filter(r=>r.status>=200&&r.status<300).length,1,JSON.stringify(results.map(r=>r.body)));
  assert.equal(results.filter(r=>r.status===409).length,1);
  const current=await session(pickup.id);
  assert.equal(current.reservedLiters,'80.00');
  assert.equal(current.collectedLiters,'0.00');
  assert.equal(current.remainingLiters,'20.00');
  assert.ok(b.user.id);
});

test('60+40 liters: collect once transfers ledger, cancellation releases only reserved stock',async()=>{
  const {a,admin,staff}=users;
  const pickup=await waterFixture(admin,(await connection(a)).zoneId!);
  let first=await transition(staff,await waterRequest(a,pickup,'60.00'),'accepted',{ownerId:staff.user.id});
  const second=await transition(staff,await waterRequest(a,pickup,'40.00'),'accepted',{ownerId:staff.user.id});
  assert.equal((await session(pickup.id)).remainingLiters,'0.00');
  const collection={expectedVersion:first.version,reason:'Immediate fictional pickup',outcome:'Collected 60 demonstration liters',nextSteps:'Contact supplier for further support'};
  const operation=key();
  const allocation=first.allocation!;
  first=await ok<AssistanceRequest>(staff,'POST',`/staff/water-allocations/${allocation.id}/collect`,collection,operation);
  const replay=await ok<AssistanceRequest>(staff,'POST',`/staff/water-allocations/${allocation.id}/collect`,collection,operation);
  assert.equal(replay.allocation?.id,first.allocation?.id);
  assert.equal(replay.version,first.version);
  assert.equal(first.status,'completed');
  assert.equal((await session(pickup.id)).remainingLiters,'0.00');
  const another=await request(staff,'POST',`/staff/water-allocations/${allocation.id}/collect`,{...collection,expectedVersion:first.version},key());
  assert.equal(another.status,409);
  const cancelled=await ok<AssistanceRequest>(a,'POST',`/assistance-requests/${second.id}/cancel`,{expectedVersion:second.version,reason:'No longer needs pickup'});
  assert.equal(cancelled.allocation?.state,'released');
  const current=await session(pickup.id);
  assert.equal(current.reservedLiters,'0.00');
  assert.equal(current.collectedLiters,'60.00');
  assert.equal(current.remainingLiters,'40.00');
  const late=await request(a,'POST',`/assistance-requests/${first.id}/cancel`,{expectedVersion:first.version,reason:'Too late'},key());
  assert.equal(late.status,409);
});

test('exact decimals and stock edits cannot reduce below existing commitments',async()=>{
  const {a,admin,staff}=users;
  const pickup=await waterFixture(admin,(await connection(a)).zoneId!,'100.25');
  await transition(staff,await waterRequest(a,pickup,'50.10'),'accepted',{ownerId:staff.user.id});
  await transition(staff,await waterRequest(a,pickup,'50.15'),'accepted',{ownerId:staff.user.id});
  let current=await session(pickup.id);
  assert.equal(current.remainingLiters,'0.00');
  const bad=await request(staff,'PATCH',`/staff/distribution/sessions/${pickup.id}`,{expectedVersion:current.version,totalLiters:'100.24',reason:'Invalid reduction'},key());
  assert.equal(bad.status,409);
  current=await ok<PickupSession>(staff,'PATCH',`/staff/distribution/sessions/${pickup.id}`,{expectedVersion:current.version,totalLiters:'110.25',reason:'Added demonstration stock'});
  assert.equal(current.remainingLiters,'10.00');
  const precision=await request(staff,'PATCH',`/staff/distribution/sessions/${pickup.id}`,{expectedVersion:current.version,totalLiters:'110.251',reason:'Unsupported precision'},key());
  assert.equal(precision.status,400);
});

test('request cancellation races with collection without double release or collection',async()=>{
  const {a,admin,staff}=users;
  const pickup=await waterFixture(admin,(await connection(a)).zoneId!);
  const item=await transition(staff,await waterRequest(a,pickup,'80.00'),'accepted',{ownerId:staff.user.id});
  const results=await Promise.all([
    request<AssistanceRequest>(a,'POST',`/assistance-requests/${item.id}/cancel`,{expectedVersion:item.version,reason:'Race cancellation'},key()),
    request<AssistanceRequest>(staff,'POST',`/staff/water-allocations/${item.allocation!.id}/collect`,{expectedVersion:item.version,reason:'Immediate pickup',outcome:'Fictional collection',nextSteps:'Review separately'},key()),
  ]);
  assert.equal(results.filter(r=>r.status>=200&&r.status<300).length,1,JSON.stringify(results.map(r=>r.body)));
  assert.equal(results.filter(r=>r.status===409).length,1);
  const detail=await ok<AssistanceRequest>(a,'GET',`/assistance-requests/${item.id}`);
  const current=await session(pickup.id);
  if(detail.status==='cancelled'){
    assert.equal(detail.allocation?.state,'released');assert.equal(current.remainingLiters,'100.00');
  }else{
    assert.equal(detail.status,'completed');assert.equal(detail.allocation?.state,'collected');assert.equal(current.remainingLiters,'20.00');
  }
  assert.equal(current.reservedLiters,'0.00');
});

test('session cancellation handles accepted and pending requests, preserves collected history and dedupes retries',async()=>{
  const {a,admin,staff}=users;
  const pickup=await waterFixture(admin,(await connection(a)).zoneId!);
  const collected=await transition(staff,await waterRequest(a,pickup,'20.00'),'accepted',{ownerId:staff.user.id});
  await ok(staff,'POST',`/staff/water-allocations/${collected.allocation!.id}/collect`,{expectedVersion:collected.version,reason:'Immediate pickup',outcome:'Collected demo quantity',nextSteps:'Review report independently'});
  const reserved=await transition(staff,await waterRequest(a,pickup,'40.00'),'accepted',{ownerId:staff.user.id});
  const pending=await waterRequest(a,pickup,'30.00');
  const current=await session(pickup.id), operation=key();
  const body={expectedVersion:current.version,reason:'Fictional session cancelled; contact supplier for follow-up'};
  const cancelled=await ok<PickupSession>(staff,'POST',`/staff/distribution/sessions/${pickup.id}/cancel`,body,operation);
  assert.equal((await ok<PickupSession>(staff,'POST',`/staff/distribution/sessions/${pickup.id}/cancel`,body,operation)).version,cancelled.version);
  assert.equal(cancelled.status,'cancelled');assert.equal(cancelled.reservedLiters,'0.00');assert.equal(cancelled.collectedLiters,'20.00');
  for(const item of [reserved,pending]){
    const detail=await ok<AssistanceRequest>(a,'GET',`/assistance-requests/${item.id}`);
    assert.equal(detail.status,'unavailable');assert.match(detail.reason??'',/cancelled/);
    const notices=await ok<Notification[]>(a,'GET','/notifications?limit=100');
    assert.ok(notices.some(n=>n.targetId===item.id&&n.text.includes('follow-up')));
  }
  assert.equal((await ok<AssistanceRequest>(a,'GET',`/assistance-requests/${collected.id}`)).status,'completed');
});

test('session-cancel versus acceptance serializes and never leaves a live reservation in cancelled session',async()=>{
  const {a,admin,staff}=users;
  const pickup=await waterFixture(admin,(await connection(a)).zoneId!);
  const item=await waterRequest(a,pickup,'80.00');
  const results=await Promise.all([
    request(staff,'POST',`/staff/assistance-requests/${item.id}/transition`,{expectedVersion:item.version,status:'accepted',ownerId:staff.user.id},key()),
    request(staff,'POST',`/staff/distribution/sessions/${pickup.id}/cancel`,{expectedVersion:pickup.version,reason:'Cancelled demonstration session; support follow-up'},key()),
  ]);
  assert.ok(results.every(r=>[200,201,409].includes(r.status)),JSON.stringify(results.map(r=>r.body)));
  let current=await session(pickup.id);
  if(current.status!=='cancelled')current=await ok<PickupSession>(staff,'POST',`/staff/distribution/sessions/${pickup.id}/cancel`,{expectedVersion:current.version,reason:'Finish cancellation with current version; follow-up'});
  assert.equal(current.reservedLiters,'0.00');
  assert.equal((await ok<AssistanceRequest>(a,'GET',`/assistance-requests/${item.id}`)).status,'unavailable');
});
