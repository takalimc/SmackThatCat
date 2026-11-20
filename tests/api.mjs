import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as rules from '../lib/leaderboard.mjs';
const source=(await readFile(new URL('../api/leaderboard.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace('export default','return');
class BlobPreconditionFailedError extends Error {}
class BlobServiceNotAvailable extends Error {}
class BlobServiceRateLimited extends Error {}
let state={leaders:[{id:'original',player:'Existing',score:99,friends:6,bossHits:49,posted:Date.now()}],recent:[]};
let reads=0,writes=0,conflict=true;
const key='test-signing-key';
const handler=new Function('get','put','BlobPreconditionFailedError','BlobServiceNotAvailable','BlobServiceRateLimited','issueTicket','verifyTicket','countTaps','runCanBePosted','parsePlayerName','publishEntry','boardResponse','process',source)(
 async(path,options)=>{
  reads++;
  assert.equal(options.useCache,false);
  // A compressed download yields W/"revision"; writes only accept the strong version.
  const etag=options.headers?.['Accept-Encoding']==='identity'?'"revision"':'W/"revision"';
  return {blob:{etag},stream:new Response(JSON.stringify(state)).body};
 },
 async(path,body,options)=>{
  writes++;assert.equal(options.addRandomSuffix,false);assert.equal(options.allowOverwrite,true);
  if(options.ifMatch!=='"revision"')throw new BlobPreconditionFailedError('weak version rejected');
  if(conflict){conflict=false;throw new BlobPreconditionFailedError('another player wrote');}
  state=JSON.parse(body);
 },BlobPreconditionFailedError,BlobServiceNotAvailable,BlobServiceRateLimited,
 rules.issueTicket,rules.verifyTicket,rules.countTaps,rules.runCanBePosted,rules.parsePlayerName,rules.publishEntry,rules.boardResponse,{env:{LEADERBOARD_SIGNING_KEY:key}});
const ticket=rules.issueTicket(key,Date.now()-35000,'roundup-clock-v1');
const input={ticket,name:'Upload Test',taps:{tabby:[0,500],boss:[0],paw:[500,1000,1500,2000,2500,3000]},friendIds:[0,1,2,3,4,5]};
const request=()=>new Request('https://game.test/api/leaderboard',{method:'POST',headers:{'content-type':'application/json',origin:'https://game.test'},body:JSON.stringify(input)});
let result=await handler.fetch(request());assert.equal(result.status,200);
let data=await result.json();assert.equal(data.ranks.find(e=>e.player==='Upload Test').score,10);
assert.equal(data.weeklyRanks.find(e=>e.player==='Upload Test').score,10);
assert.equal(data.ranks.find(e=>e.id==='original').score,99);
assert.equal(writes,2);assert.equal(reads,2);
result=await handler.fetch(request());assert.equal(result.status,200);assert.equal(writes,2);
assert.equal(state.leaders.filter(e=>e.player==='Upload Test').length,1);
assert.equal((await handler.fetch(new Request('https://game.test/api/leaderboard'))).status,200);
console.log('PASS: actual API handler saves a compressed-size board, retries a concurrent write, preserves scores, returns both periods and prevents duplicate posts');
