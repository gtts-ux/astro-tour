const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mkdtempSync,rmSync}=require('node:fs');
const os=require('node:os');const path=require('node:path');
const {createLocalApi}=require('./local-api.cjs');
const {createApiController}=require('./api-controller.cjs');
test('loopback API authenticates, validates routes and reports absent data',async()=>{
 let snapshot=null;const api=createLocalApi({token:'test-key',version:'1.3.0',snapshot:()=>snapshot,port:0});const base=await api.start();
 try{assert.match(base,/^http:\/\/127\.0\.0\.1:/);const headers={Authorization:'Bearer test-key'};
 assert.equal((await fetch(base+'/v1/score')).status,401);
 assert.equal((await fetch(base+'/v1/score',{headers:{...headers,Origin:'https://example.com'}})).status,403);
 assert.equal((await fetch(base+'/v1/score',{headers})).status,503);
 snapshot={score:78,partial:true,location:{latitude:52.23,longitude:21.01}};
 const r=await fetch(base+'/v1/score',{headers});const body=await r.json();assert.equal(body.score,78);assert.equal(body.partial,true);assert.equal(body.app_version,'1.3.0');assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('access-control-allow-origin'),null);
 assert.equal((await fetch(base+'/bad',{headers})).status,404);assert.equal((await fetch(base+'/v1/score',{method:'POST',headers})).status,405);
 assert.equal((await (await fetch(base+'/v1/health',{headers})).json()).status,'ok');
 snapshot=null;assert.equal((await fetch(base+'/v1/score',{headers})).status,503);
 }finally{await api.stop()}
});
test('API key rotation revokes the old key; settings survive restart',async()=>{
 const directory=mkdtempSync(path.join(os.tmpdir(),'astro-api-test-'));const controller=createApiController(directory,'1.3.0',0);let restored;
 try{assert.equal(controller.status().enabled,false);const first=await controller.configure('enable');controller.publish({score:65,location:{latitude:1,longitude:2}});assert.equal((await fetch(first.endpoint,{headers:{Authorization:'Bearer '+first.token}})).status,200);const rotated=await controller.configure('rotate');assert.notEqual(first.token,rotated.token);assert.equal((await fetch(rotated.endpoint,{headers:{Authorization:'Bearer '+first.token}})).status,401);assert.equal((await fetch(rotated.endpoint,{headers:{Authorization:'Bearer '+rotated.token}})).status,200);await controller.stop();restored=createApiController(directory,'1.3.0',0);await restored.initialize();assert.equal(restored.status().enabled,true);assert.equal(restored.status().token,rotated.token);await restored.configure('disable');assert.equal(restored.status().enabled,false);assert.throws(()=>controller.publish({score:101}),/Invalid/);
 }finally{await controller.stop();await restored?.stop();rmSync(directory,{recursive:true,force:true})}
});
