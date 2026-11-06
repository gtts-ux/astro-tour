const {_electron:electron}=require('playwright');
const assert=require('node:assert/strict');
const {mkdtempSync,existsSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const os=require('node:os');
const {locationHelper}=require('./location.cjs');
(async()=>{
 const profile=mkdtempSync(path.join(os.tmpdir(),'astro-tour-smoke-'));
 const app=await electron.launch({...(process.env.ASTRO_EXECUTABLE?{executablePath:process.env.ASTRO_EXECUTABLE}:{}),args:[...(process.env.ASTRO_EXECUTABLE?[]:['.']),`--user-data-dir=${profile}`]});
 try{
  const errors=[];
  const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(45000);
  const info=await app.evaluate(({app})=>({packaged:app.isPackaged,resources:process.resourcesPath,platform:process.platform}));
  if(info.packaged){const helper=locationHelper(info.platform,true,info.resources,__dirname);assert.ok(existsSync(helper),'Native location helper is bundled');const diagnostic=JSON.parse(execFileSync(helper,['--diagnose'],{encoding:'utf8',timeout:15000}));if(info.platform==='darwin')assert.equal(diagnostic.identifier,'com.astrotour.location');else assert.equal(diagnostic.platform,'win32')}
  await app.evaluate(({ipcMain})=>{
   ipcMain.removeHandler('locate');ipcMain.handle('locate',()=>({error:'Location permission denied. Choose a place on the Map.'}));
   ipcMain.removeHandler('light');ipcMain.handle('light',()=>({bortle:4,sqm:21.2,ratio:1.1,source:'Test atlas fixture',estimated:true}));
   ipcMain.removeHandler('fetch');ipcMain.handle('fetch',(_,url)=>{
    if(url.includes('geocoding'))return {results:[{name:'Sample observation site',country:'United States',latitude:40.7,longitude:-74}]};
    const start=Math.floor(Date.now()/86400000)*86400-86400;const time=Array.from({length:8*24},(_,i)=>start+i*3600);const fill=value=>time.map(()=>value);
    return {timezone:'America/New_York',hourly:{time,temperature_2m:fill(8),relative_humidity_2m:fill(60),dew_point_2m:fill(2),cloud_cover:fill(10),cloud_cover_low:fill(5),cloud_cover_mid:fill(2),cloud_cover_high:fill(3),precipitation_probability:fill(0),precipitation:fill(0),wind_speed_10m:fill(4),visibility:fill(30000),surface_pressure:fill(1013)}}
   });
  });
  await page.locator('#locationDialog').waitFor({state:'visible'});await page.locator('#allowLocation').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('permission denied'));
  await app.evaluate(({ipcMain})=>{ipcMain.removeHandler('locate');ipcMain.handle('locate',()=>({lat:40.7,lon:-74,accuracy:100}))});
  await page.locator('#locate').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Updated'));
  assert.equal(await page.locator('.metric').count(),8);assert.ok((await page.locator('#lightStatus').textContent()).includes('21.20'));
  assert.ok(await page.locator('#mapView').isHidden());const clock=await page.locator('#selectedClock').textContent();await page.waitForTimeout(1200);assert.notEqual(clock,await page.locator('#selectedClock').textContent());assert.equal(await page.locator('#clockZone').textContent(),'America/New_York');
  await page.locator('#timeline').fill('3');assert.equal(await page.locator('#timeMode').textContent(),'PREVIEW');const dateBefore=await page.locator('#date').inputValue();const nextDate=await page.locator('#date').evaluate(e=>{const d=new Date(e.value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10)});await page.locator('#date').fill(nextDate);await page.locator('#date').dispatchEvent('change');assert.notEqual(await page.locator('#date').inputValue(),dateBefore);
  await page.locator('#now').click();assert.equal(await page.locator('#timeMode').textContent(),'LIVE');
  await page.locator('#mapnav').click();assert.ok(await page.locator('#plannerView').isHidden());assert.ok(await page.locator('#mapView').isVisible());await page.locator('#map').click({position:{x:150,y:150}});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Updated'));
  await page.locator('#overview').click();for(const theme of ['astro','day','night']){await page.locator(`button[data-theme=${theme}]`).click();assert.equal(await page.locator('body').getAttribute('data-theme'),theme)}
  await page.locator('#save').click();await page.locator('#savednav').click();assert.ok(await page.locator('#results button').count()>0);assert.deepEqual(errors,[]);
  console.log('PASS: packaged native helper, location consent/denial/success, forecast, automatic atlas, seconds clock, location time zone, slider/date/live reset, Map selection, themes and saved places.');
 }finally{await app.close()}
})().catch(e=>{console.error(e);process.exit(1)});
