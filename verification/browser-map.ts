import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
import type {Report,Zone} from '../aqours-contracts/src/index.ts';
import {connection,denied,fixturePassword,key,login,ok} from './harness.ts';

// The custom-template and synthetic Geoapify-key builds both use intercepted local images.
// Automated pan/zoom never requests public provider tiles.
const output=path.resolve('.local/evidence');
const temporary=path.resolve('.cache/tmp');
await Promise.all([mkdir(output,{recursive:true}),mkdir(temporary,{recursive:true})]);
const customer=await login('customer01@demo.aqours.test');
const other=await login('customer02@demo.aqours.test');
const admin=await login('admin@demo.aqours.test','web');
const zone=await ok<Zone>(admin,'POST','/staff/settings/zones',{code:`MAP-${key()}`,name:'Fictional isolated rendered map zone',demo:true,boundary:{type:'Polygon',coordinates:[[[121.16,14.22],[121.18,14.22],[121.18,14.24],[121.16,14.24],[121.16,14.22]]]}});
const fixtures:Report[]=[];
const categories=['outage','leak','low_pressure','water_quality'];
const labels=['No water','Leak','Low pressure','Water quality'];
const colors=['rgb(220, 38, 38)','rgb(37, 99, 235)','rgb(180, 83, 9)','rgb(124, 58, 237)'];
for (const [index,category] of categories.entries()) {
  const actor=[customer,other][index%2];
  let item=await ok<Report>(actor,'POST','/reports',{
    connectionId:(await connection(actor)).id,category,noticedAt:new Date().toISOString(),
    description:'Fictional independent report at the same rendered map point',
    location:{address:'Fictional map center',source:'gps',confirmed:true,latitude:14.23,longitude:121.17},
  });
  item=await ok<Report>(admin,'PATCH',`/staff/reports/${item.id}`,{expectedVersion:item.version,zoneId:zone.id,zoneConfirmed:true,priority:['normal','high','urgent','normal'][index],reason:'Reviewed independent overlap fixture'});
  fixtures.push(item);
}
const [item,companion]=fixtures;
await denied(customer,'GET',`/reports/${companion.id}`);
const context=await chromium.launchPersistentContext(path.resolve('.local/map-browser-profile'),{
  executablePath:'/usr/bin/chromium',headless:true,viewport:{width:1440,height:1000},
  env:{...process.env,TMPDIR:temporary},args:['--no-sandbox'],
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
page.on('pageerror',error=>errors.push(error.stack || error.message));
page.on('request',request=>{
  if(observingMap&&request.url().includes('/api/v1/')&&!['GET','OPTIONS'].includes(request.method()))
    mapWrites.push(`${request.method()} ${new URL(request.url()).pathname}`);
});
page.on('response',response=>{
  if(response.url().includes('/staff/map/reports?')&&response.status()===200)mapQueries.push(new URL(response.url()));
  if(/^https:\/\/(tiles\.example\.test|maps\.geoapify\.com)\//.test(response.url())&&response.status()>=400)providerFailures.push(String(response.status()));
});
const width=()=>{
  const query=mapQueries.at(-1)?.searchParams;
  return query?Number(query.get('east'))-Number(query.get('west')):360;
};
const tile=await readFile(new URL('./fixtures/street-tile.png',import.meta.url));
const localTile=/^https:\/\/(tiles\.example\.test|maps\.geoapify\.com)\//;
try{
  await page.route('**/staff/connections*', async route => {
    // Controlled saved customer points keep this overlap fixture independent of seed addresses.
    const data = await Promise.all([customer, other].map(actor => connection(actor)));
    await route.fulfill({ json: { data: data.map(item => ({ ...item, latitude: 14.23, longitude: 121.17 })) },
      headers: { 'Access-Control-Allow-Origin': web, 'Access-Control-Allow-Credentials': 'true' } });
  });
  await page.route(localTile,route=>route.fulfill({contentType:'image/png',body:tile}));
  // No other public raster source is allowed to slip through.
  await page.route('https://tile.openstreetmap.org/**',route=>route.abort());
  await page.goto(web);
  await page.getByLabel('Email',{exact:true}).fill('staff@demo.aqours.test');
  await page.getByLabel('Password',{exact:true}).fill(fixturePassword);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  const raster=page.waitForResponse(response=>localTile.test(response.url()),{timeout:30000});
  observingMap=true;
  await page.goto(`${web}/#/map?zoneId=${zone.id}`);
  assert.equal((await raster).status(),200);
  await expect.poll(()=>mapQueries.some(url=>url.searchParams.get('west')!=='120.9')).toBe(true);
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await expect(page.getByRole('alert').filter({hasText:/Street tiles/})).toHaveCount(0);
  await expect(page.locator('.map-scope-count')).toHaveText('4 reports shown · 0 unlocated');
  await page.locator('details.map-filter-disclosure > summary').click();
  await expect(page.getByText('4 mapped · 4 reports in the viewport before text search · 0 unlocated reports across the selected filters',{exact:true})).toBeVisible();
  await page.locator('details.map-filter-disclosure > summary').click();
  passed('Leaflet renders local raster tiles and requests actual bounded viewport data');

  await expect(page.locator('.report-cluster')).toHaveCount(1);
  await expect(page.locator('.report-cluster')).toHaveText('2');
  await expect(page.locator('.report-cluster span')).toHaveCSS('background-color','rgb(220, 38, 38)');
  await page.locator('.report-cluster').click();
  await expect(page.locator('.report-marker')).toHaveCount(2);
  const centers=await page.locator('.report-marker').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return [b.x,b.y];}));
  assert.notDeepEqual(centers[0],centers[1]);
  for (const [index,fixture] of fixtures.entries()) {
    await page.getByRole('button',{name:`Select ${fixture.reference} on map`,exact:true}).click();
    const marker=page.locator(`.report-marker[title^="${fixture.reference} ·"]`);
    await expect(marker).toHaveAccessibleName(new RegExp(`${fixture.reference} · ${labels[index]} · ${fixture.priority} priority`));
    await expect(marker.locator('span')).toHaveCSS('background-color',colors[index]);
    const legend=page.getByRole('list',{name:'Report types'}).getByRole('listitem').filter({hasText:labels[index]});
    await expect(legend.locator('.map-legend-swatch')).toHaveCSS('background-color',colors[index]);
    if (await page.locator('.leaflet-popup-close-button').count()) await page.locator('.leaflet-popup-close-button').click();
    await marker.click();
    await expect(page.locator('.leaflet-popup')).toHaveCount(1);
    await expect(page.locator('.leaflet-popup').getByText(fixture.reference,{exact:true})).toBeVisible();
    await expect(page.getByRole('region',{name:'Selected report',exact:true})).toContainText(fixture.reference);
    await expect(page).toHaveURL(new RegExp(`selected=${fixture.id}`));
    await expect(page.locator('.leaflet-popup')).toContainText(`${labels[index]} · received · ${fixture.priority} priority`);
  }
  passed('A red mixed cluster counts two customers once; list selection exposes all four issue icons with matching legend and priority text');

  fixtures[3]=await ok<Report>(admin,'PATCH',`/staff/reports/${fixtures[3].id}`,{
    expectedVersion:fixtures[3].version,priority:'urgent',reason:'Verify category color is independent of priority',
  });
  await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect(page.getByRole('region',{name:'Selected report',exact:true})).toContainText(fixtures[3].reference);
  await expect(page.locator('.leaflet-popup')).toContainText(fixtures[3].reference);
  await expect(page.locator('.leaflet-popup')).toContainText('Water quality · received · urgent priority');
  await expect(page.getByRole('region',{name:'Selected report',exact:true})).toContainText('Urgent priority');
  await page.getByRole('button',{name:`Select ${fixtures[3].reference} on map`,exact:true}).click();
  await expect(page.locator('.report-marker')).toHaveCount(2);
  await expect(page.locator(`.report-marker[title^="${fixtures[3].reference} ·"] span`)).toHaveCSS('background-color',colors[3]);
  passed('Priority changes refresh text and retain selected report; expanded markers keep their category colors');

  const before=width();
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await expect.poll(width).toBeLessThan(before*.75);
  assert.ok(mapQueries.every(url=>url.searchParams.get('zoneId')===zone.id));
  for (const [index] of fixtures.entries()) {
    const actor=[customer,other][index%2];
    const current=await ok<Report>(actor,'GET',`/reports/${fixtures[index].id}`);
    assert.equal(current.version,fixtures[index].version);
    assert.equal(current.incidentId,fixtures[index].incidentId);
    assert.equal(current.priority,fixtures[index].priority);
  }
  assert.deepEqual(mapWrites,[]);
  passed('Zoom changes query bounds without changing report priority, version or incident association');

  await expect(page.getByRole('link',{name:'OpenStreetMap',exact:true})).toBeVisible();
  await expect(page.locator('.leaflet-control-scale')).toContainText(/m|km/);
  for (const [name,color] of [['Service zones','#64748b'],['Incident areas','#0f766e'],['Advisory areas','#b45309']]) {
    const control=page.getByLabel('Map layers',{exact:true}).getByRole('checkbox',{name,exact:true});
    await control.uncheck(); await expect(page.locator(`path[stroke="${color}"]`)).toHaveCount(0);
    await control.check();
  }
  const reportLayer=page.getByLabel('Map layers',{exact:true}).getByRole('checkbox',{name:'Customers',exact:true});
  await reportLayer.uncheck(); await expect(page.locator('.report-marker,.report-cluster')).toHaveCount(0); await reportLayer.check();
  await expect(page.locator('path[stroke="#64748b"]').first()).toBeVisible();
  passed('Independent Leaflet layer controls preserve visible attribution and metric scale');

  const row=page.getByRole('row').filter({has:page.getByRole('link',{name:item.reference,exact:true})});
  await row.getByRole('button',{name:`Select ${item.reference} on map`,exact:true}).click();
  await expect(page.locator('.leaflet-popup')).toHaveCount(1);
  await expect(page.locator('.leaflet-popup').getByText(item.reference,{exact:true})).toBeVisible();
  await expect(page.locator('.leaflet-popup').getByText('Fictional map center',{exact:true})).toBeVisible();
  await page.locator('.leaflet-popup').getByRole('button',{name:'Open report',exact:true}).click();
  await expect(page.getByRole('heading',{name:item.reference,exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Back to inbox',exact:true}).click();
  await expect(page.getByRole('region',{name:'Selected report',exact:true})).toContainText(item.reference);
  passed('List and persisted-point selection open the correct authorized report and retain return context');

  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'List',exact:true}).click();
  await expect(page.getByRole('heading',{name:/^Report list(?: · \d+)?$/})).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeHidden();
  await page.getByRole('button',{name:'Map',exact:true}).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.getByRole('heading',{name:/^Report list(?: · \d+)?$/})).toBeHidden();
  const dimensions=await page.locator('.leaflet-container').boundingBox();
  assert.ok(dimensions&&dimensions.width>250&&dimensions.width<391);
  await page.screenshot({path:path.join(output,'web-map-mobile.png'),fullPage:true});
  passed('Narrow screens switch between usable list and resized map views');

  await page.setViewportSize({width:1440,height:1000});
  await page.unroute(localTile);
  await page.route(localTile,route=>route.abort('failed'));
  await page.reload();
  await expect(page.getByRole('alert').filter({hasText:'Street tiles could not load'})).toBeVisible();
  await expect(page.getByRole('link',{name:item.reference,exact:true})).toBeVisible();
  await page.unroute(localTile);
  await page.route(localTile,route=>route.fulfill({contentType:'image/png',body:tile}));
  const recovery=page.waitForResponse(response=>localTile.test(response.url()));
  await page.getByRole('button',{name:'Retry basemap',exact:true}).click();
  assert.equal((await recovery).status(),200);
  await expect(page.getByRole('alert').filter({hasText:'Street tiles could not load'})).toHaveCount(0);
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  passed('Raster failures keep the report list usable and recover through an explicit basemap retry');
  await page.screenshot({path:path.join(output,'web-map-rendered.png'),fullPage:true});
  for (const viewportWidth of [1440,768,390]) {
    await page.goto(`${web}/#/map?zoneId=${zone.id}&view=map`);
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await page.setViewportSize({width:viewportWidth,height:900});
    await page.evaluate(()=>{
      document.querySelector<HTMLAnchorElement>('.leaflet-control-zoom-in')?.click();
      window.location.hash='/reports';
    });
    await expect(page.getByRole('heading',{name:'Report inbox',exact:true})).toBeVisible();
  }
  await page.waitForTimeout(500);
  assert.deepEqual(errors,[]);
  passed('Rapid zoom, responsive resize and route exit tear down Leaflet without deferred callbacks');
  assert.deepEqual(errors,[]);
  assert.deepEqual(mapWrites,[]);
  passed('No uncaught JavaScript exceptions or map-originated writes during Leaflet interaction');
}catch(error){
  await page.screenshot({path:path.join(output,'web-map-render-failure.png'),fullPage:true});
  throw error;
}finally{
  await writeFile(path.join(output,'browser-map-results.txt'),evidence.join('\n')+'\n');
  await writeFile(path.join(output,'browser-map-provider-errors.txt'),providerFailures.join('\n')+'\n');
  await writeFile(path.join(output,'browser-map-runtime-errors.txt'),errors.join('\n')+'\n');
  await context.close();
}
