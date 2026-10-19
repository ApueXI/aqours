import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { actors, connection, denied, key, login, ok, report, request, origin, base } from './harness.ts';
import type { Attachment, Notification, AssistanceRequest, ReportDetail } from '../aqours-contracts/src/index.ts';

let users: Awaited<ReturnType<typeof actors>>;
before(async () => { users = await actors(); });

test('DEMO-006: owner guards cover reports, messages, files, guidance, notifications and assistance', async () => {
  const { a, b, staff } = users;
  const item = await report(a);
  await denied(b,'GET',`/reports/${item.id}`);
  await denied(b,'POST',`/reports/${item.id}/messages`,{text:'foreign attempt'});
  await denied(b,'POST',`/reports/${item.id}/still-affected`,{expectedVersion:item.version,reason:'foreign attempt'});
  await denied(b,'POST',`/reports/${item.id}/guidance`,{answers:{}});
  await denied(a,'GET','/staff/reports');
  await denied(a,'GET','/staff/map/reports?west=120&south=10&east=125&north=15');
  await denied(null,'GET',`/reports/${item.id}`);
  const own = await ok<ReportDetail>(a,'GET',`/reports/${item.id}`);
  assert.equal(own.customerId,a.user.id);
  await ok(staff,'POST',`/staff/reports/${item.id}/notes`,{text:'PRIVATE OPERATIONAL NOTE'});
  const safe = await ok<ReportDetail>(a,'GET',`/reports/${item.id}`);
  assert.equal(safe.notes,undefined);
  assert.ok(!JSON.stringify(safe).includes('PRIVATE OPERATIONAL NOTE'));
  const assistance = await ok<AssistanceRequest>(a,'POST','/assistance-requests',{reportId:item.id,type:'callback',details:{question:'Demo question',contactMethod:'phone',contactNumber:'09000000001',preferredWindow:'Tomorrow morning'}});
  await denied(b,'GET',`/assistance-requests/${assistance.id}`);
  await denied(b,'POST',`/assistance-requests/${assistance.id}/cancel`,{expectedVersion:assistance.version,reason:'foreign attempt'});
  await denied(a,'POST',`/staff/assistance-requests/${assistance.id}/transition`,{expectedVersion:assistance.version,status:'accepted'});
  await ok(staff,'POST',`/staff/reports/${item.id}/messages`,{text:'Acknowledged for review'});
  const notices = await ok<Notification[]>(a,'GET','/notifications?limit=100');
  assert.ok(notices.length);
  await denied(b,'GET',`/notifications/${notices[0].id}`);
  await denied(b,'PATCH',`/notifications/${notices[0].id}/read`,{});
  const list = await ok<ReportDetail[]>(b,'GET','/reports?limit=100');
  assert.ok(list.every(x=>x.customerId===b.user.id));
});

test('revocable sessions: logout replay and revoked bearer cannot access private data', async () => {
  const actor = await login('customer03@demo.aqours.test');
  const result = await request(actor,'POST','/auth/logout',{});
  assert.ok([200,204].includes(result.status));
  await denied(actor,'GET','/me');
  const repeated = await request(actor,'POST','/auth/logout',{});
  assert.ok([200,204].includes(repeated.status));
});

test('browser cookie requires CSRF and exact origin; customer cannot enter supplier session', async () => {
  const { staff } = users;
  assert.ok(staff.cookie);
  assert.ok(staff.csrfToken);
  const body = {category:'outage',summary:'CSRF should reject',zoneIds:[],area:'Demo test'};
  const noCsrf = await request({...staff,csrfToken:undefined},'POST','/staff/incidents',body,key());
  assert.equal(noCsrf.status,403);
  const crossOrigin = await fetch(base+'/staff/incidents',{method:'POST',headers:{Origin:'https://untrusted.example',Cookie:staff.cookie!,'X-CSRF-Token':staff.csrfToken!,'Idempotency-Key':key(),'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal(crossOrigin.status,403);
  const wrongClient = await request(null,'POST','/auth/login',{email:'customer01@demo.aqours.test',password:'DemoWater2026!',client:'web'});
  assert.ok([401,403].includes(wrongClient.status));
  const bad = await request(null,'POST','/auth/login',{email:'absent@demo.aqours.test',password:'wrong',client:'mobile'});
  assert.equal(bad.status,401);
  const loginOrigin = await fetch(base+'/auth/login',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({email:'staff@demo.aqours.test',password:'DemoWater2026!',client:'web'})});
  assert.equal(loginOrigin.status,403);
  assert.equal(origin,'http://localhost:5173');
});

test('controlled images validate contents, authenticate downloads and replay upload retry', async () => {
  const {a,b,staff}=users;
  const item=await report(a);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lqkAAAAASUVORK5CYII=','base64');
  const operation=key();
  async function upload(bytes:Uint8Array,type:string,op=operation) {
    const form=new FormData();
    form.append('file',new Blob([new Uint8Array(bytes)],{type}),'photo.png');
    return fetch(base+`/reports/${item.id}/attachments`,{method:'POST',headers:{Origin:origin,Authorization:`Bearer ${a.token}`,'Idempotency-Key':op},body:form});
  }
  const uploaded=await upload(png,'image/png');
  assert.ok(uploaded.ok,await uploaded.clone().text());
  const attachment=(await uploaded.json() as {data:Attachment}).data;
  const replay=await upload(png,'image/png');
  assert.ok(replay.ok,await replay.clone().text());
  assert.equal((await replay.json() as {data:Attachment}).data.id,attachment.id);
  for(const actor of [b,null]) await denied(actor,'GET',`/attachments/${attachment.id}`);
  for(const actor of [a,staff]) {
    const response=await fetch(base+`/attachments/${attachment.id}`,{headers:actor.token?{Authorization:`Bearer ${actor.token}`}:{Cookie:actor.cookie!}});
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-type')??'',/^image\//);
    assert.match(response.headers.get('cache-control')??'',/no-store|private/);
    assert.ok((await response.arrayBuffer()).byteLength);
  }
  const rejected=await upload(Buffer.from('<script>alert(1)</script>'),'image/png',key());
  assert.ok([400,415].includes(rejected.status));
  const oversized=await upload(new Uint8Array(5*1024*1024+1),'image/png',key());
  assert.equal(oversized.status,413);
  const detail=await ok<ReportDetail>(a,'GET',`/reports/${item.id}`);
  assert.equal(detail.attachments.length,1);
});

test('profile and connection lookups derive identity; alternate report leaves saved address unchanged', async()=>{
  const {a,b}=users;
  const own=await connection(a), foreign=await connection(b);
  const bad=await request(a,'POST','/reports',{connectionId:foreign.id,category:'leak',description:'Foreign connection attempt',noticedAt:new Date().toISOString()},key());
  assert.ok([403,404].includes(bad.status));
  const created=await ok<ReportDetail>(a,'POST','/reports',{connectionId:own.id,category:'leak',description:'Alternate unresolved issue location',noticedAt:new Date().toISOString(),location:{address:'Unconfirmed fictional lane',source:'geocoded_address',confirmed:false}});
  assert.equal(created.zoneId,null);
  assert.equal(created.latitude,null);
  assert.equal(created.locationReview,true);
  const after=await connection(a);
  assert.equal(after.address,own.address);
  assert.equal(after.latitude,own.latitude);
});
