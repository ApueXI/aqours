import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
import type {Report,Zone} from '../aqours-contracts/src/index.ts';
import {connection,fixturePassword,key,login,ok} from './harness.ts';
const output=path.resolve('.local/evidence');
const temporary=path.resolve('.cache/tmp');
await Promise.all([mkdir(output,{recursive:true}),mkdir(temporary,{recursive:true})]);
const customer=await login('customer01@demo.aqours.test');
const admin=await login('admin@demo.aqours.test','web');
const zone=await ok<Zone>(admin,'POST','/staff/settings/zones',{code:`MAP-${key()}`,name:'Fictional isolated rendered map zone',demo:true});
let item=await ok<Report>(customer,'POST','/reports',{
  connectionId:(await connection(customer)).id,category:'leak',noticedAt:new Date().toISOString(),
  description:'Fictional exact-coordinate rendered-map fixture',
  location:{address:'Fictional map center',source:'gps',confirmed:true,latitude:14.6,longitude:121.01},
});
item=await ok<Report>(admin,'PATCH',`/staff/reports/${item.id}`,{expectedVersion:item.version,zoneId:zone.id,zoneConfirmed:true,reason:'Reviewed isolated map test point'});
let companion=await ok<Report>(customer,'POST','/reports',{
  connectionId:(await connection(customer)).id,category:'leak',noticedAt:new Date().toISOString(),
  description:'Fictional independent report at the same rendered map point',
  location:{address:'Fictional map center',source:'gps',confirmed:true,latitude:14.6,longitude:121.01},
});
companion=await ok<Report>(admin,'PATCH',`/staff/reports/${companion.id}`,{expectedVersion:companion.version,zoneId:zone.id,zoneConfirmed:true,reason:'Reviewed independent cluster fixture'});
const context=await chromium.launchPersistentContext(path.resolve('.local/map-browser-profile'),{
  executablePath:'/usr/bin/chromium',headless:true,viewport:{width:1440,height:1000},
  env:{...process.env,TMPDIR:temporary},
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
});
await context.clearCookies();
const page=await context.newPage();
page.setDefaultTimeout(20000);
page.setDefaultNavigationTimeout(20000);
const web=process.env.AQOURS_TEST_WEB??'http://localhost:5173';
const evidence:string[]=[];
const mapQueries:URL[]=[];
const errors:string[]=[];
const providerFailures:string[]=[];
const mapWrites:string[]=[];
let observingMap=false;
const passed=(message:string)=>{evidence.push(message);console.log('PASS',message);};
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>{
  if(observingMap&&request.url().includes('/api/v1/')&&!['GET','OPTIONS'].includes(request.method()))
    mapWrites.push(`${request.method()} ${new URL(request.url()).pathname}`);
});
page.on('response',response=>{
  if(response.url().includes('/staff/map/reports?')&&response.status()===200)mapQueries.push(new URL(response.url()));
  if(response.url().startsWith('https://demotiles.maplibre.org/')&&response.status()>=400)providerFailures.push(`${response.status()} ${response.url()}`);
});
page.on('requestfailed',request=>{
  if(request.url().startsWith('https://demotiles.maplibre.org/'))providerFailures.push(`${request.failure()?.errorText} ${request.url()}`);
});
const width=()=>{
  const query=mapQueries.at(-1)?.searchParams;
  return query?Number(query.get('east'))-Number(query.get('west')):360;
};
try{
  await page.goto(web);
  await page.getByLabel('Email',{exact:true}).fill('staff@demo.aqours.test');
  await page.getByLabel('Password',{exact:true}).fill(fixturePassword);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  const style=page.waitForResponse(response=>response.url()==='https://demotiles.maplibre.org/style.json',{timeout:30000});
  observingMap=true;
  await page.goto(`${web}/#/map?zoneId=${zone.id}`);
  assert.equal((await style).status(),200);
  await expect.poll(()=>mapQueries.some(url=>url.searchParams.get('west')!=='120.9'),{timeout:30000}).toBe(true);
  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  await expect(page.getByText('The basemap or map rendering is unavailable. Use the report list below; the report service can still be available.',{exact:true})).toHaveCount(0);
  passed('Live public demo style loads in real MapLibre/WebGL and requests viewport data');
  await expect(page.getByText('2 mapped of 2 matching reports in the viewport · 0 unlocated reports across the selected filters', {exact:true})).toBeVisible();
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const initialBox=await page.locator('.maplibregl-canvas').boundingBox();
  assert.ok(initialBox);
  const clusteredWidth=width();
  await page.locator('.maplibregl-canvas').click({position:{x:initialBox.width/2,y:initialBox.height/2}});
  await expect.poll(width,{timeout:15000}).toBeLessThan(clusteredWidth*.75);
  await expect(page.getByRole('heading',{name:'Report map',exact:true})).toBeVisible();
  passed('Selecting a real two-report cluster expands its viewport instead of creating or merging incidents');
  for(let step=0;step<7&&width()>=.005;step++){
    const before=width();
    await page.getByRole('button',{name:'Zoom in',exact:true}).click();
    await expect.poll(width,{timeout:15000}).toBeLessThan(before*.75);
  }
  assert.ok(width()<.01);
  assert.ok(mapQueries.every(url=>url.searchParams.get('zoneId')===zone.id));
  const current=await ok<Report>(customer,'GET',`/reports/${item.id}`);
  assert.equal(current.version,item.version);
  assert.equal(current.incidentId,item.incidentId);
  assert.equal(current.priority,item.priority);
  const second=await ok<Report>(customer,'GET',`/reports/${companion.id}`);
  assert.equal(second.version,companion.version);
  assert.equal(second.incidentId,companion.incidentId);
  assert.equal(second.priority,companion.priority);
  assert.deepEqual(mapWrites,[]);
  passed('Zoom changes query bounds without changing report priority, version or incident association');
  await page.screenshot({path:path.join(output,'web-map-rendered.png'),fullPage:true});
  const box=await page.locator('.maplibregl-canvas').boundingBox();
  assert.ok(box);
  await page.locator('.maplibregl-canvas').click({position:{x:box.width/2,y:box.height/2}});
  const reference=new RegExp(`^(?:${item.reference}|${companion.reference})$`);
  await expect(page.getByRole('heading',{name:reference})).toBeVisible();
  passed('Rendered point at the persisted longitude/latitude opens its authorized report');
  assert.deepEqual(errors,[]);
  passed('No uncaught JavaScript exceptions during actual map rendering and selection');
}catch(error){
  await page.screenshot({path:path.join(output,'web-map-render-failure.png'),fullPage:true});
  throw error;
}finally{
  await writeFile(path.join(output,'browser-map-results.txt'),evidence.join('\n')+'\n');
  await writeFile(path.join(output,'browser-map-provider-errors.txt'),providerFailures.join('\n')+'\n');
  await context.close();
}
