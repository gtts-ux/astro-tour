const {test}=require('node:test');const assert=require('node:assert/strict');const {evaluate}=require('./engine');
const weather={cloud:0,humidity:45,wind:2,visibility:30000,rain:0};const night={sunAltitude:-30,moonAltitude:-10,illumination:100};
test('idealna ciemna noc daje 100%',()=>assert.equal(evaluate(weather,night,1).score,100));
test('dzień ogranicza wynik mimo dobrej pogody',()=>assert.ok(evaluate(weather,{...night,sunAltitude:10},1).score<=5));
test('opady i całkowite zachmurzenie ograniczają wynik',()=>{assert.ok(evaluate({...weather,rain:1},night,1).score<=10);assert.ok(evaluate({...weather,cloud:100},night,1).score<=10)});
test('Księżyc pod horyzontem nie obniża oceny',()=>assert.equal(evaluate(weather,night,1).score,evaluate(weather,{...night,illumination:0},1).score));
test('brak Bortle oznacza częściową ocenę',()=>assert.equal(evaluate(weather,night,null).partial,true));
test('gorsze światło i Księżyc obniżają ocenę',()=>{assert.ok(evaluate(weather,night,9).score<100);assert.ok(evaluate(weather,{...night,moonAltitude:80},1).score<100)});
