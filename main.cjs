const {app,BrowserWindow,ipcMain,shell,session}=require('electron');
const path=require('path');
const {execFile}=require('node:child_process');
const {lookup}=require('./light.cjs');
const {locationHelper}=require('./location.cjs');
ipcMain.handle('light',(_,lat,lon)=>lookup(lat,lon));
let pendingLocation;
ipcMain.handle('locate',()=>{
 if(pendingLocation)return pendingLocation;
 let helper;try{helper=locationHelper(process.platform,app.isPackaged,process.resourcesPath,__dirname)}catch(e){return {error:e.message}}
 pendingLocation=new Promise(resolve=>{execFile(helper,[],{timeout:65000},(error,stdout)=>{try{const data=JSON.parse(stdout);if(!data.error&&(!Number.isFinite(data.lat)||!Number.isFinite(data.lon)))throw Error('Invalid position');resolve(data)}catch{resolve({error:'Location could not start. Reopen Astro Tour and try again, or select a place on the Map.'})}})}).finally(()=>{pendingLocation=null});
 return pendingLocation;
});
app.setName('Astro Tour');
const allowed=new Set(['api.open-meteo.com','geocoding-api.open-meteo.com']);
ipcMain.handle('fetch',async(_,url)=>{const u=new URL(url);if(u.protocol!=='https:'||!allowed.has(u.hostname))throw Error('Source not allowed');const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Data server: ${r.status}`);return r.json()});
ipcMain.handle('external',(_,url)=>{if(url==='https://www.lightpollutionmap.info/')shell.openExternal(url)});
app.whenReady().then(()=>{session.defaultSession.setPermissionRequestHandler((_,__,cb)=>cb(false));function create(){const w=new BrowserWindow({width:1420,height:960,minWidth:1050,minHeight:720,backgroundColor:'#0b1019',title:'Astro Tour',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false}});w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());w.loadFile('index.html')}create();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)create()})});app.on('window-all-closed',()=>app.quit());
