import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { ElevatorController } from '../js/elevator/ElevatorController.js';
import { DoorController } from '../js/elevator/DoorController.js';
import { CallController } from '../js/control/CallController.js';

function elevator(){
  const car={setFloorPosition(){},setDoorOpen(){}},building={floors:10,floorHeight:3,floorY:f=>f*3,setHallDoorOpen(){}};
  const calls=new CallController(),doors=new DoorController(car,building),sounds=[];
  const controller=new ElevatorController(car,doors,calls,building,()=>{},{maxSpeed:2,acceleration:1,deceleration:1},{playArrival:d=>sounds.push(d)});
  return {controller,calls,doors,sounds};
}
function until(e,predicate){
  for(let i=0;i<20000;i++){e.update(.02);if(predicate())return;}
  assert.fail('simulation timed out');
}
test('hall and car calls at the same destination produce one door cycle',()=>{
  const {controller:e,calls,sounds}=elevator();
  e.request(3,'up');e.update(.02);e.request(3,'car');
  until(e,()=>e.state==='ARRIVAL_WAIT');
  assert.deepEqual(calls.queue,[]);
  until(e,()=>e.state==='IDLE');
  for(let i=0;i<100;i++)e.update(.02);
  assert.equal(e.state,'IDLE');assert.deepEqual(sounds,[1]);
});
for(const phase of ['SAME_FLOOR_RESPONSE','ARRIVAL_WAIT','opening','open','closing']){
  test(`opposite call survives ${phase} without interrupting doors`,()=>{
    const {controller:e,calls,doors,sounds}=elevator();
    if(phase==='ARRIVAL_WAIT'){
      e.request(3,'up');until(e,()=>e.state==='ARRIVAL_WAIT');
    }else{
      e.position=3;e.request(3,'up');
      if(phase==='opening')until(e,()=>doors.progress>0&&doors.progress<.5);
      if(phase==='open')until(e,()=>doors.isOpen());
      if(phase==='closing')until(e,()=>doors.target===0&&doors.progress>.1);
    }
    const state=e.state,target=doors.target,elapsed=doors.elapsed;
    e.request(3,'down');e.request(3,'down');e.request(3,'up');e.request(3,'car');
    assert.deepEqual(calls.queue,[{floor:3,direction:'down'}]);
    assert.equal(e.state,state);assert.equal(doors.target,target);assert.equal(doors.elapsed,elapsed);
    until(e,()=>e.state==='SAME_FLOOR_RESPONSE'&&e.sameFloorDirection===-1);
    until(e,()=>e.state==='IDLE');e.update(.02);
    assert.deepEqual(sounds,[1,-1]);assert.deepEqual(calls.queue,[]);
  });
}
test('arrival preserves opposite hall call while clearing car call',()=>{
  const {controller:e,calls}=elevator();
  e.request(3,'up');e.update(.02);e.request(3,'car');e.request(3,'down');
  until(e,()=>e.state==='ARRIVAL_WAIT');
  assert.deepEqual(calls.queue,[{floor:3,direction:'down'}]);
});

const workerSource=readFileSync(new URL('../../service-worker.js',import.meta.url),'utf8');
for(const destination of ['script','image']){
  test(`worker caches ${destination} after response consumption and serves it offline`,async()=>{
    let handler,release,offline=false;
    const stored=new Map(),pending=[];
    const gate=new Promise(resolve=>{release=resolve;});
    const cache={async put(request,response){stored.set(request.url,await response.text());}};
    vm.runInNewContext(workerSource,{URL,Response,console,
      self:{location:{origin:'https://test.local'},addEventListener(name,fn){if(name==='fetch')handler=fn;}},
      fetch:async()=>{if(offline)throw Error('offline');return new Response('asset content');},
      caches:{open:async()=>{await gate;return cache;},match:async request=>stored.has(request.url)?new Response(stored.get(request.url)):undefined}
    });
    const request={method:'GET',url:`https://test.local/asset.${destination}`,destination};
    let responsePromise;
    const event={request,respondWith(p){responsePromise=p;},waitUntil(p){pending.push(p);}};
    handler(event);
    assert.equal(await (await responsePromise).text(),'asset content');
    assert.equal(pending.length,1);assert.equal(stored.size,0);
    release();await Promise.all(pending);
    offline=true;handler(event);
    assert.equal(await (await responsePromise).text(),'asset content');
  });
}
