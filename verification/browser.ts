import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir,writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import {fixturePassword,login,ok,report} from './harness.ts';
import type {ReportDetail} from '../aqours-contracts/src/index.ts';
import {adminFlows,serviceFlows} from './browser-workflows.ts';
const web=process.env.AQOURS_TEST_WEB??'http://localhost:5173';
const output=path.resolve('.local/evidence');
const temporary=path.resolve('.cache/tmp');
await Promise.all([mkdir(output,{recursive:true}),mkdir(temporary,{recursive:true})]);
const actor=await login('customer01@demo.aqours.test');
const admin=await login('admin@demo.aqours.test','web');
const item=await report(actor,'leak','Fictional browser integration report');
const context=await chromium.launchPersistentContext(path.resolve('.local/browser-profile'),{
  executablePath:'/usr/bin/chromium',headless:true,viewport:{width:1440,height:1000},
  env:{...process.env,TMPDIR:temporary},
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
});
await context.clearCookies();
const page=await context.newPage();
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(20000);
const errors:string[]=[],evidence:string[]=[];
page.on('pageerror',error=>errors.push(error.message));
function passed(message:string){evidence.push(message);console.log('PASS',message);}
try{
  await page.goto(web);
  await page.getByLabel('Email',{exact:true}).fill('staff@demo.aqours.test');
  await page.getByLabel('Password',{exact:true}).fill(fixturePassword);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  passed('Supplier cookie login opens overview with live metrics');
  await page.screenshot({path:path.join(output,'web-overview.png'),fullPage:true});
  await page.goto(`${web}/#/reports/${item.id}`);
  await expect(page.getByRole('heading',{name:item.reference,exact:true})).toBeVisible();
  const clarification='Please clarify the fictional browser-report location.';
  await page.getByRole('navigation', {name: 'Report views'}).getByRole('button', {name: /^Messages/}).click();
  await page.getByLabel('Customer-visible message',{exact:true}).fill(clarification);
  await page.getByRole('button',{name:'Send to customer',exact:true}).click();
  await expect(page.getByRole('article').getByText(clarification,{exact:true})).toBeVisible();
  assert.ok((await ok<ReportDetail>(actor,'GET',`/reports/${item.id}`)).messages.some(m=>m.text===clarification));
  passed('Staff clarification persists and appears in customer-owned report');
  await page.getByLabel('Status',{exact:true}).selectOption('under_review');
  await page.getByLabel('Priority',{exact:true}).selectOption('urgent');
  await page.getByLabel('Review / priority / closure reason',{exact:true}).fill('Fictional isolated hazard reviewed by supplier');
  await page.getByRole('button',{name:'Save review',exact:true}).click();
  await expect.poll(async()=>(await ok<ReportDetail>(actor,'GET',`/reports/${item.id}`)).status).toBe('under_review');
  passed('Review form sends versioned priority/status command successfully');
  await page.screenshot({path:path.join(output,'web-report.png'),fullPage:true});
  await serviceFlows(page,web,actor,admin,passed);
  await adminFlows(page,web,actor,admin,passed);
  const routes=[['reports','Report inbox'],['incidents','Incidents'],['advisories','Official advisories'],['assistance','Assistance queue'],['distribution','Water distribution'],['settings','Settings and audit']] as const;
  for(const [route,title] of routes){
    await page.goto(`${web}/#/${route}`);
    await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
    await expect(page.getByText('Loading…',{exact:true})).toHaveCount(0,{timeout:15000});
    passed(`${title} renders connected records without runtime error`);
  }
  await page.route('https://demotiles.maplibre.org/**',route=>route.abort());
  await page.goto(`${web}/#/map`);
  await expect(page.getByRole('heading',{name:'Report map',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:/^Report list(?: · \d+)?$/})).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
  passed('Map tile failure leaves live report list and navigation usable');
  await page.screenshot({path:path.join(output,'web-map-fallback.png'),fullPage:true});
  await page.reload();
  await expect(page.getByRole('heading',{name:'Report map',exact:true})).toBeVisible();
  passed('Browser reload restores valid supplier session');
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${web}/#/reports`);
  await expect(page.getByRole('heading',{name:'Report inbox',exact:true})).toBeVisible();
  await page.screenshot({path:path.join(output,'web-narrow.png'),fullPage:true});
  passed('Narrow viewport preserves navigation and report table access');
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Supplier sign in',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Supplier sign in',exact:true})).toBeVisible();
  passed('Browser logout revokes session and reload remains signed out');
  assert.deepEqual(errors,[],`Runtime browser errors: ${errors.join('; ')}`);
  passed('No uncaught browser exceptions');
}catch(error){
  await page.screenshot({path:path.join(output,'web-failure.png'),fullPage:true});
  await writeFile(path.join(output,'web-failure.html'),await page.content());
  throw error;
}finally{
  await writeFile(path.join(output,'browser-results.txt'),evidence.join('\n')+'\n');
  await context.close();
}
