(function(root){
const clamp=n=>Math.max(0,Math.min(100,n));
function evaluate(w,astro,bortle){
 const values=[['Chmury',clamp(100-w.cloud),40],['Księżyc',astro.moonAltitude<=0?100:clamp(100-astro.illumination*Math.sin(astro.moonAltitude*Math.PI/180)),15],['Wilgotność',clamp(100-Math.max(0,w.humidity-55)*2.2),10],['Wiatr',clamp(100-Math.max(0,w.wind-4)*4),10],['Widzialność',clamp(w.visibility/250),10]];
 if(bortle)values.push(['Ciemność nieba',clamp((9-bortle)/8*100),15]);
 if(!values.every(v=>Number.isFinite(v[1]))||!Number.isFinite(w.rain)||!Number.isFinite(astro.sunAltitude))return null;
 let score=values.reduce((s,v)=>s+v[1]*v[2],0)/values.reduce((s,v)=>s+v[2],0);
 if(astro.sunAltitude>=0)score=Math.min(score,5);else if(astro.sunAltitude>-12)score=Math.min(score,20);else if(astro.sunAltitude>-18)score=Math.min(score,55);
 if(w.rain>0)score=Math.min(score,10);if(w.cloud>=95)score=Math.min(score,10);else if(w.cloud>=80)score=Math.min(score,25);
 return {score:Math.round(score),values,partial:!bortle};
}
const api={evaluate,clamp};if(typeof module!=='undefined')module.exports=api;else root.AstroEngine=api;
})(globalThis);
