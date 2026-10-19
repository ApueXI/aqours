import assert from 'node:assert/strict';
import {expect,type Page} from '@playwright/test';
import type {Advisory,AssistanceRequest,PublishedIncident,Report,StaffIncident,User} from '../aqours-contracts/src/index.ts';
import {connection,fixturePassword,key,ok,report,waterFixture,type Actor} from './harness.ts';

type Passed=(message:string)=>void;
const localMinute=(date:number)=>new Date(date+8*3600000).toISOString().slice(0,16);
async function assistance(page:Page,web:string,item:AssistanceRequest){
  await page.goto(`${web}/#/assistance/${item.id}`);
  await expect(page.getByRole('heading',{name:item.reference,exact:true})).toBeVisible();
}
async function status(page:Page,value:string){
  await expect(page.getByRole('heading',{name:value,exact:true})).toBeVisible();
}
async function confirm(page:Page,name:string,path:string,method='POST'){
  const [response]=await Promise.all([
    page.waitForResponse(response=>new URL(response.url()).pathname.endsWith(path)&&response.request().method()===method),
    page.getByRole('button',{name,exact:true}).click(),
  ]);
  assert.equal(response.status(),200,`Confirmed browser mutation ${path} must commit`);
}
export async function serviceFlows(page:Page,web:string,customer:Actor,admin:Actor,passed:Passed){
  const staff=(await ok<User[]>(admin,'GET','/staff/users')).find(user=>user.active&&user.email==='staff@demo.aqours.test')!;
  const item=await report(customer);
  let callback=await ok<AssistanceRequest>(customer,'POST','/assistance-requests',{reportId:item.id,type:'callback',details:{question:'Fictional browser callback',contactMethod:'phone',contactNumber:'09000000001',preferredWindow:'Morning'}});
  await assistance(page,web,callback);
  await page.getByLabel('Assigned staff owner',{exact:true}).selectOption(staff.id);
  await page.getByRole('button',{name:'Mark accepted',exact:true}).click();
  await status(page,'Callback · Accepted');
  passed('Callback acceptance assigns a staff owner through the browser');
  await page.getByLabel('Next status',{exact:true}).selectOption('scheduled');
  const first=localMinute(Date.now()+3600000),second=localMinute(Date.now()+7200000);
  await page.getByLabel('Agreed appointment / pickup time (Manila)',{exact:true}).fill(first);
  await page.getByRole('button',{name:'Mark scheduled',exact:true}).click();
  await status(page,'Callback · Scheduled');
  await page.getByLabel('Agreed appointment / pickup time (Manila)',{exact:true}).fill(second);
  await page.getByLabel('Required change / immediate-support reason',{exact:true}).fill('Fictional customer requested later callback');
  await page.getByRole('button',{name:'Record reschedule',exact:true}).click();
  await expect.poll(async()=>(await ok<AssistanceRequest>(customer,'GET',`/assistance-requests/${callback.id}`)).appointmentAt).toBe(new Date(second+':00+08:00').toISOString());
  passed('Browser scheduling and reasoned rescheduling persist Manila appointment instants');
  await page.getByLabel('Next status',{exact:true}).selectOption('in_progress');
  await page.getByRole('button',{name:'Mark in progress',exact:true}).click();
  await status(page,'Callback · In progress');
  await page.getByLabel('Next status',{exact:true}).selectOption('completed');
  await page.getByLabel('Contact / service outcome',{exact:true}).fill('Fictional browser contact completed');
  await page.getByLabel('Customer next steps',{exact:true}).fill('Continue separate report review');
  await page.getByRole('button',{name:'Mark completed',exact:true}).click();
  await status(page,'Callback · Completed');
  callback=await ok<AssistanceRequest>(customer,'GET',`/assistance-requests/${callback.id}`);
  assert.equal(callback.outcome,'Fictional browser contact completed');
  assert.equal((await ok<Report>(customer,'GET',`/reports/${item.id}`)).status,'received');
  passed('Browser callback completion exposes outcome without resolving its report');

  const session=await waterFixture(admin,(await connection(customer)).zoneId!,'100.00');
  const water=await ok<AssistanceRequest>(customer,'POST','/assistance-requests',{reportId:item.id,type:'water_support',details:{sessionId:session.id,requestedLiters:'25.50'}});
  await assistance(page,web,water);
  await page.getByLabel('Assigned staff owner',{exact:true}).selectOption(staff.id);
  await page.getByRole('button',{name:'Mark accepted',exact:true}).click();
  await status(page,'Water support · Accepted');
  const accepted=await ok<AssistanceRequest>(customer,'GET',`/assistance-requests/${water.id}`);
  assert.equal(accepted.allocation?.liters,'25.50');
  await page.goto(`${web}/#/distribution`);
  await page.getByLabel('Pickup or request reference',{exact:true}).fill(accepted.allocation!.reference);
  await page.getByRole('button',{name:'Find reservation',exact:true}).click();
  await page.getByRole('link',{name:`${accepted.reference} · ${accepted.allocation!.reference}`,exact:true}).click();
  await status(page,'Water support · Accepted');
  await page.getByLabel('Immediate collection reason',{exact:true}).fill('Fictional customer ready for immediate pickup');
  await page.getByLabel('Collection outcome',{exact:true}).fill('Collected 25.50 liters in fictional browser demonstration');
  await page.getByLabel('Customer next steps',{exact:true}).last().fill('Inspect independent report updates');
  await page.getByRole('button',{name:'Record collection',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Confirm collection of 25.50 liters',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Confirm record collection',exact:true}).click();
  await status(page,'Water support · Completed');
  const collected=await ok<AssistanceRequest>(customer,'GET',`/assistance-requests/${water.id}`);
  assert.equal(collected.allocation?.state,'collected');
  assert.equal(collected.session?.collectedLiters,'25.50');
  assert.equal(collected.session?.remainingLiters,'74.50');
  passed('Pickup-reference lookup and explicit browser collection persist exact stock ledger changes');

  const incident=await ok<StaffIncident>(admin,'POST','/staff/incidents',{category:'outage',summary:'Fictional browser incident publication',zoneIds:[(await connection(customer)).zoneId],area:'Fictional browser service area',demo:true});
  await page.goto(`${web}/#/incidents/${incident.id}`);
  await page.getByLabel('Customer-visible progress',{exact:true}).fill('Fictional browser progress; restoration unknown');
  await page.getByRole('button',{name:'Publish update',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Customer preview',exact:true})).toBeVisible();
  await confirm(page,'Confirm publish update',`/staff/incidents/${incident.id}/updates`);
  await expect.poll(async()=>(await ok<PublishedIncident>(customer,'GET',`/incidents/${incident.id}`)).latestUpdate.progress).toBe('Fictional browser progress; restoration unknown');
  passed('Incident publication preview commits a customer-visible snapshot with unknown restoration');
}

export async function adminFlows(page:Page,web:string,customer:Actor,admin:Actor,passed:Passed){
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('admin@demo.aqours.test');
  await page.getByLabel('Password',{exact:true}).fill(fixturePassword);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByText('Demo admin',{exact:true})).toBeVisible();
  await page.goto(`${web}/#/settings`);
  await page.locator('summary').filter({hasText:/^Create account$/}).click();
  const form=page.locator('details').filter({has:page.locator('summary',{hasText:'Create account'})});
  const email=`browser-${key()}@demo.aqours.test`;
  await form.getByLabel('Account email',{exact:true}).fill(email);
  await form.getByLabel('Name',{exact:true}).fill('Fictional browser customer');
  await form.getByLabel('Initial password',{exact:true}).fill(fixturePassword);
  await form.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByRole('cell',{name:email,exact:true})).toBeVisible();
  passed('Administrator account form provisions a persisted customer without public registration');

  const advisory=await ok<Advisory>(admin,'POST','/staff/advisories',{kind:'do_not_drink',title:'Fictional browser restriction',text:'Fictional demonstration only: follow supplier instructions.',source:'Fictional supplier demonstration source',zoneIds:[(await connection(customer)).zoneId],demo:true});
  await page.goto(`${web}/#/advisories/${advisory.id}`);
  await page.getByRole('button',{name:'Publish advisory',exact:true}).click();
  await expect(page.getByRole('region',{name:'Publication preview'})).toBeVisible();
  await confirm(page,'Confirm publish advisory',`/staff/advisories/${advisory.id}/publish`);
  await expect.poll(async()=>(await ok<Advisory>(customer,'GET',`/advisories/${advisory.id}`)).state).toBe('published');
  passed('Administrator previews and publishes an independent quality restriction');
  await page.getByText('Revise published advisory',{exact:true}).click();
  await page.getByLabel('Approved customer instructions',{exact:true}).fill('Fictional revised supplier instructions; demonstration only.');
  await page.getByLabel('Revision reason',{exact:true}).fill('Fictional browser correction');
  await page.getByRole('button',{name:'Save advisory revision',exact:true}).click();
  await confirm(page,'Confirm save advisory revision',`/staff/advisories/${advisory.id}`,'PATCH');
  await expect.poll(async()=>(await ok<Advisory>(customer,'GET',`/advisories/${advisory.id}`)).text).toBe('Fictional revised supplier instructions; demonstration only.');
  passed('Explicit advisory revision updates customer content while preserving publication history');
  await page.getByLabel('Authorized lifting reason',{exact:true}).fill('Fictional authorized lifting for browser verification');
  await page.getByRole('button',{name:'Lift advisory',exact:true}).click();
  await confirm(page,'Confirm lift advisory',`/staff/advisories/${advisory.id}/lift`);
  await expect.poll(async()=>(await ok<Advisory>(customer,'GET',`/advisories/${advisory.id}`)).state).toBe('lifted');
  passed('Explicit administrator lifting ends the restriction independently');
}
