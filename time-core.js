(function(root){
 const minute=60000;
 function dateAt(instant,zone){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(instant));}
 function minutesForDate(times,date,zone){const result=[],formatter=new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});for(let i=0;i<times.length;i++){const start=times[i]*1000;if(formatter.format(start)!==date&&formatter.format(start+59*minute)!==date)continue;for(let m=0;m<60;m++){const instant=start+m*minute;if(formatter.format(instant)===date)result.push({instant,hourIndex:i});}}return result;}
 function nearestMinuteIndex(minutes,instant){let low=0,high=minutes.length-1,result=0;while(low<=high){const mid=Math.floor((low+high)/2);if(minutes[mid].instant<=instant){result=mid;low=mid+1}else high=mid-1;}return result;}
 function halfHourSlots(date,zone){const base=Date.parse(date+'T12:00:00Z');const result=[];const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:zone,minute:'2-digit'});for(let t=base-36*3600000;t<base+36*3600000;t+=15*minute){if(dateAt(t,zone)===date&&Number(formatter.format(t))%30===0)result.push(t);}return result;}
 const api={dateAt,minutesForDate,nearestMinuteIndex,halfHourSlots};if(typeof module!=='undefined')module.exports=api;else root.AstroTime=api;
})(globalThis);
