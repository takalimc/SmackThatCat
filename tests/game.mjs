import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.template.html',import.meta.url), 'utf8');
const combo = (await readFile(new URL('../lib/combo.mjs',import.meta.url),'utf8')).replace(/^export /gm,'');
const code = html.split('<script>')[1].split('</script>')[0].replace('/* COMBO_RULES */', () => combo);
assert.match(html, /#game, #arena, #target \{ touch-action: none; \}/);
assert.match(html, /#target \{ -webkit-tap-highlight-color: transparent; \}/);
assert.match(html, /@media \(any-pointer: coarse\) \{\s*#target \{ transition: none; \}/);

function setup({ audio = true, highest = 100, transientFailure = false, storage = new Map(), day = '2026-11-19', blocked = false } = {}) {
  let now = 1000, id = 0;
  const frames = new Map(), timers = new Map(), elements = new Map();
  const notes = [];
  const submissions = [];
  const clips = [];
  const fades = [];
  let stoppedNotes = 0;
  const counts = { decoded: 0, started: 0, stopped: 0, animated: 0, load: 0, fallback: 0, players: 0 };
  const get = name => {
    if (!elements.has(name)) {
      const classes = new Set();
      elements.set(name, {
        get className() { return [...classes].join(' '); },
        set className(value) { classes.clear(); value.split(' ').filter(Boolean).forEach(value => classes.add(value)); },
        classList: {
          add: value => classes.add(value),
          remove: value => classes.delete(value),
          contains: value => classes.has(value),
          toggle: (value, state) => state ? classes.add(value) : classes.delete(value)
        },
        children: Array.from({ length: 6 }, () => ({classList:{add(){}},animate(){}})), replaceChildren(...children) { this.children = children; },
        events: {}, addEventListener(event, callback) { this.events[event] = callback; }, setAttribute() {},
        focus() {}, style: {setProperty(){}}, clientWidth: 360, clientHeight: 450, offsetWidth: 160, offsetHeight: 160,
        animate() { counts.animated++; return { cancel() {} }; }
      });
    }
    return elements.get(name);
  };
  class AudioContext {
    state = 'suspended';
    destination = {};
    async resume() { this.state = 'running'; }
    async decodeAudioData(data) { counts.decoded++; return data; }
    get currentTime() { return now / 1000; }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime(value, at) { fades.push({value,at}); } }, connect() {}, disconnect() {} }; }
    createOscillator() { return {
      frequency: {}, connect() {}, disconnect() {},
      start(at) { notes.push({ pitch: this.frequency.value, at }); },
      stop(at) { if (at === undefined) stoppedNotes++; }
    }; }
    createBufferSource() {
      return {
        playbackRate: {value:1}, connect() {}, disconnect() {},
        start(at,offset) { counts.started++; clips.push({asset:this.buffer.asset,loop:this.loop,at,offset}); },
        stop() { counts.stopped++; this.onended?.(); }
      };
    }
  }
  const window = audio ? { AudioContext } : {};
  vm.runInNewContext(code, {
    document: {
      getElementById: get, addEventListener() {},
      createElement() {
        const classes=new Set();
        classes.remove=classes.delete;
        return {children:[],dataset:{},style:{setProperty(){}},events:{},attributes:{},classList:classes,
          appendChild(el){this.children.push(el);},replaceChildren(...items){this.children=items;},
          setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.events[k]=f;},animate(){}};
      }
    }, window,
    localStorage:{getItem(key){if(blocked)throw Error('Blocked');return storage.get(key)??null;},setItem(key,value){if(blocked)throw Error('Blocked');storage.set(key,value);}},
    Date:class extends Date {constructor(...args){super(...(args.length?args:[day+'T12:00:00']));}},
    location: {protocol:'https:'}, AbortSignal,
    Image: class {}, Audio: class {
      constructor() { counts.players++; }
      pause() {}
      async play() { counts.fallback++; throw Error('playback unavailable'); }
    },
    fetch: async (url, request) => {
      if (url !== '/api/leaderboard') {
        counts.load++;
        return {arrayBuffer: async () => ({asset:url,duration:url.includes('background') ? 38.4 : 1})};
      }
      if (!request.body) return {ok:true,json:async()=>({ranks:highest ? [{id:'old',player:'Other cat',score:highest,friends:0}] : []})};
      const body=JSON.parse(request.body);
      if (body.action === 'start') return {ok:true,json:async()=>({ticket:'test-ticket'})};
      submissions.push(body);
      if (transientFailure && submissions.length===1) return {ok:false,status:503,json:async()=>({error:'Busy'})};
      return {ok:true,json:async()=>({entryId:'new',ranks:[{id:'new',player:body.name,score:31,bossHits:2}]})};
    },
    performance: { now: () => now },
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
    cancelAnimationFrame: key => frames.delete(key),
    setTimeout(fn, delay) { timers.set(++id, [now + delay, fn]); return id; },
    clearTimeout: key => timers.delete(key)
  });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  const step = (amount, paint = true) => {
    now += amount;
    for (const [key, [time, fn]] of [...timers]) if (time <= now) { timers.delete(key); fn(); }
    if (paint) for (const [key, fn] of [...frames]) if (frames.delete(key)) fn(now);
  };
  const tap = (isPrimary = true, button = 0) => get('target').events.pointerdown({ isPrimary, button, preventDefault() {} });
  return { get, counts, settle, step, tap, notes, clips, fades, submissions, storage, stoppedNotes: () => stoppedNotes, state: window.__smackQA };
}








const game=setup();
game.get('play').onclick();await game.settle();
game.step(15000);game.step(1800);game.step(5000);game.step(800);game.step(2100);game.step(2500);
const buttons=game.get('roundupFriends').children;
assert.equal(buttons.filter(b=>Number(b.dataset.friend)>=0).length,2);
const press=b=>b.events.pointerdown({type:'pointerdown',isPrimary:true,button:0,preventDefault(){}});
press(buttons.find(b=>Number(b.dataset.friend)<0));
assert.equal(game.state().score,0);
assert.equal(game.state().friendCount,0);
for(let i=0;i<6;i++){
 game.step(500);
 const b=buttons.find(b=>Number(b.dataset.friend)>=0);
 press(b);
 if(i<5)assert.equal(game.state().score,0);
}
assert.equal(game.state().friendCount,6);
assert.equal(game.state().score,7);
assert.equal(game.state().phase,'round-result');
assert.equal(game.get('roundupPack').children.length,6);
assert.match(game.get('roundResultPoints').textContent,/7 Roundup points/);
press(buttons[0]);assert.equal(game.state().score,7);
game.step(2800);await game.settle();
assert.match(game.get('summary').textContent,/7 seconds left = \+7 points/);
game.get('again').onclick();assert.equal(game.state().score,0);
const miss=setup();miss.get('play').onclick();await miss.settle();
miss.step(15000);miss.step(1800);miss.step(5000);miss.step(800);miss.step(2100);miss.step(2500);miss.step(10000);
assert.equal(miss.state().phase,'round-result');
assert.equal(miss.state().score,0);
console.log('PASS: two friends and distractor, misses score zero, six catches in three seconds award seven points, no late scoring, celebration and reset');

const key='smack-pawsy-progress-v1';
const saved=new Map();
const daily=setup({storage:saved});
async function round(g, count=6) {
  g.get('play').onclick(); await g.settle();
  g.step(15000);g.step(1800);g.step(5000);g.step(800);g.step(2100);g.step(2500);
  const choices=g.get('roundupFriends').children;
  for(let i=0;i<count;i++) {g.step(500);press(choices.find(b=>Number(b.dataset.friend)>=0));}
  if(count<6)g.step(10000);
  g.step(2800);await g.settle();
}
await round(daily);
assert.equal(JSON.parse(saved.get(key)).best,7);
assert.equal(JSON.parse(saved.get(key)).today,6);
assert.equal(JSON.parse(saved.get(key)).counts.filter(n=>n===1).length,6);
assert.match(daily.get('personalResult').textContent,/New personal best/);
await round(daily);await round(daily);
assert.equal(JSON.parse(saved.get(key)).today,18);
assert.deepEqual(JSON.parse(saved.get(key)).ribbons,['2026-11-19']);
assert.match(daily.get('dailyResult').textContent,/gift unlocked/);
await round(daily);
assert.equal(JSON.parse(saved.get(key)).ribbons.length,1);
assert.deepEqual(JSON.parse(saved.get(key)).counts,Array(6).fill(4));
const reload=setup({storage:saved});
assert.match(reload.get('homeProgress').textContent,/Personal best 7/);
assert.equal(reload.get('dailyMeter').value,18);
const tomorrow=setup({storage:saved,day:'2026-11-20'});
assert.equal(tomorrow.get('dailyMeter').value,0);
await round(tomorrow,2);
assert.equal(JSON.parse(saved.get(key)).today,2);
assert.equal(JSON.parse(saved.get(key)).best,7);
assert.equal(JSON.parse(saved.get(key)).ribbons.length,1);
const blocked=setup({blocked:true});await round(blocked);
assert.match(blocked.get('saveNote').textContent,/Saving is unavailable/);
assert.equal(blocked.state().score,7);
const corrupt=setup({storage:new Map([[key,'{broken']])});await round(corrupt);
assert.equal(corrupt.state().score,7);
console.log('PASS: saved personal best and album, partial collections, daily completion, one ribbon per day, replay/reload persistence, next-day reset, blocked/corrupt storage; ranked scores unchanged');
