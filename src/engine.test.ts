import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cases,observe,evaluate,type Evidence} from './engine.ts';
test('hidden errors require the interaction that reveals them',()=>{
 assert.equal(observe(cases[0],'password','inspect',[]).crimeId,null);
 assert.equal(observe(cases[0],'password','inspect',['register-error']).crimeId,'requirements');
});
test('tool and suspect must match; red herrings cannot prove a crime',()=>{
 assert.equal(observe(cases[2],'pay','inspect',['payment-pending']).crimeId,null);
 assert.equal(observe(cases[2],'pay','probe',['payment-pending']).crimeId,'feedback');
 assert.equal(observe(cases[0],'badge','inspect',[]).crimeId,null);
});
test('correct, false and duplicate accusations are distinct',()=>{
 const e:Evidence={id:'1',...observe(cases[0],'email','inspect',[])};
 assert.equal(evaluate(cases[0],e,'Etiqueta ausente',[]),'correct');
 assert.equal(evaluate(cases[0],e,'Falta de feedback',[]),'false');
 assert.equal(evaluate(cases[0],e,'Etiqueta ausente',['label']),'duplicate');
});
test('all cases have unique crime ids and registered suspects',()=>{
 for(const c of cases){assert.equal(new Set(c.crimes.map(x=>x.id)).size,c.crimes.length);for(const crime of c.crimes){assert.ok(c.suspects[crime.suspect]);assert.ok(c.tools.includes(crime.tool))}}
});
