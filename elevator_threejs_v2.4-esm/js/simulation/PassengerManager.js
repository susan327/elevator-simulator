export class PassengerManager {
  constructor({bank,building,dispatch,config,renderer,log,onNewHallCall=()=>{}}){
    this.bank=bank;this.building=building;this.dispatch=dispatch;this.config=config;this.renderer=renderer;this.log=log;this.onNewHallCall=onNewHallCall;
    this.passengers=[];this.nextId=1;this.riders=new Map([...bank.units.keys()].map(id=>[id,new Set()]));
  }
  waitingAt(floor){return this.passengers.filter(p=>p.origin===floor&&['waiting','approaching','boarding'].includes(p.state)).length;}
  countIn(id){return this.riders.get(id)?.size||0;}
  reservedFor(id){return this.passengers.filter(p=>p.assignedId===id&&p.state==='approaching').length;}
  isFull(id){return this.countIn(id)>=this.config.capacity;}
  routeLeg(origin,finalDestination){const direct=['A','B'].find(id=>this.config.isServed(origin,id)&&this.config.isServed(finalDestination,id));if(direct)return {destination:finalDestination,preferredId:direct};const common=this.config.servedFloorsFor('A').filter(f=>this.config.isServed(f,'B')),transfer=common.sort((a,b)=>Math.abs(a-origin)+Math.abs(a-finalDestination)-(Math.abs(b-origin)+Math.abs(b-finalDestination)))[0];return transfer?{destination:transfer,preferredId:['A','B'].find(id=>this.config.isServed(origin,id)&&this.config.isServed(transfer,id))}:null;}
  chooseTrip(pattern){const floors=this.building.floorService.servedNumbers;if(floors.length<2)return null;let origin,destination;const pick=items=>items[Math.floor(Math.random()*items.length)];if(pattern==='morning'&&Math.random()<.75){origin=floors[0];destination=pick(floors.slice(1));}else if(pattern==='evening'&&Math.random()<.75){origin=pick(floors.slice(1));destination=floors[0];}else{origin=pick(floors);destination=pick(floors.filter(f=>f!==origin));}return {origin,destination};}
  spawn(pattern){
    const trip=this.chooseTrip(pattern);if(!trip||this.waitingAt(trip.origin)>=this.config.maxWaitingPerFloor)return false;
    const leg=this.routeLeg(trip.origin,trip.destination);if(!leg)return false;const direction=leg.destination>trip.origin?'up':'down',isNew=!this.dispatch.hasActiveCall(trip.origin,direction);
    const assignedId=this.dispatch.assign(trip.origin,direction,{requiredFloor:leg.destination});if(!assignedId)return false;if(isNew)this.onNewHallCall({floor:trip.origin,direction,source:'passenger'});
    const passenger={id:this.nextId++,...trip,finalDestination:trip.destination,destination:leg.destination,direction,assignedId,state:'waiting',elapsed:0};this.passengers.push(passenger);
    this.renderer.create(passenger);this.layoutWaiting(trip.origin);this.log(`乗客${passenger.id}：${trip.origin}F→${passenger.finalDestination}F${leg.destination!==passenger.finalDestination?`（15F乗換）`:''}（共通待機列・${assignedId}号機応答予定）`);return true;
  }
  layoutWaiting(floor){this.renderer.layoutWaiting(this.passengers.filter(p=>p.origin===floor&&p.state==='waiting'));}
  exitingAt(unit,floor){return this.passengers.some(p=>p.assignedId===unit.id&&p.state==='exiting'&&p.destination===floor);}
  beginExits(){
    for(const p of this.passengers){
      if(p.state!=='riding')continue;const unit=this.bank.get(p.assignedId);if(!unit)continue;
      if(Math.abs(unit.controller.position-p.destination)<.04&&unit.doors.isBoardable()){
        p.state='exiting';p.elapsed=0;this.riders.get(unit.id)?.delete(p.id);unit.controller.extendDoorHold(2.2);this.renderer.beginExit(p,unit);this.renderer.layoutRiders(unit,this.riders.get(unit.id));
      }
    }
  }
  beginApproaches(){
    for(const unit of this.bank.units.values()){
      const floor=Math.round(unit.controller.position);if(!unit.doors.isBoardable()||Math.abs(unit.controller.position-floor)>=.04||this.exitingAt(unit,floor))continue;
      const candidates=this.passengers.filter(p=>p.state==='waiting'&&p.origin===floor&&this.dispatch.assignedTo(floor,p.direction)===unit.id);
      let available=Math.max(0,this.config.capacity-this.countIn(unit.id)-this.reservedFor(unit.id));
      candidates.forEach((p,index)=>{p.assignedId=unit.id;if(available<=0)return;p.state='approaching';p.elapsed=-index*.32;this.renderer.beginApproach(p,unit,index);unit.controller.extendDoorHold(2.5+index*.32);available--;});
      if(candidates.length>available&&this.countIn(unit.id)+this.reservedFor(unit.id)>=this.config.capacity)this.reassignOverflow(unit,floor,candidates.filter(p=>p.state==='waiting'));
    }
  }
  reassignOverflow(unit,floor,passengers){
    for(const p of passengers){unit.calls.cancel(floor,p.direction);p.assignedId=this.dispatch.assign(floor,p.direction,{excludeIds:[unit.id]});this.renderer.returnToQueue(p);this.log(`乗客${p.id}：${unit.id}号機満員（${this.countIn(unit.id)}/${this.config.capacity}人）のため${p.assignedId}号機を待ちます`);}
    if(passengers.length)this.layoutWaiting(floor);
  }
  update(dt){
    for(const unit of this.bank.units.values())unit.doors.setObstructed(false);
    this.beginExits();this.beginApproaches();
    for(const p of [...this.passengers]){
      const unit=this.bank.get(p.assignedId);if(!unit)continue;
      if(['approaching','boarding','exiting'].includes(p.state))unit.doors.setObstructed(true);
      if(p.state==='approaching'){
        p.elapsed+=dt;if(p.elapsed<0)continue;this.renderer.updateTransition(p,Math.min(1,p.elapsed/.9));
        if(p.elapsed>=.9){p.state='boarding';p.elapsed=0;this.riders.get(unit.id).add(p.id);this.renderer.beginBoarding(p,unit);this.layoutWaiting(p.origin);}
      }else if(p.state==='boarding'){
        p.elapsed+=dt;this.renderer.updateTransition(p,Math.min(1,p.elapsed/1.05));
        if(p.elapsed>=1.05){p.state='riding';p.elapsed=0;this.renderer.board(p,unit,this.riders.get(unit.id));unit.controller.request(p.destination,'car',{closeDoors:false});unit.controller.extendDoorHold(1.5);this.log(`乗客${p.id}：${unit.id}号機へ乗車（${this.countIn(unit.id)}/${this.config.capacity}人）・${p.destination}Fを登録`);}
      }else if(p.state==='exiting'){
        p.elapsed+=dt;this.renderer.updateTransition(p,Math.min(1,p.elapsed/1.45));
        if(p.elapsed>=1.45){if(p.destination!==p.finalDestination){const transfer=p.destination,leg=this.routeLeg(transfer,p.finalDestination);p.origin=transfer;p.destination=leg.destination;p.direction=p.destination>transfer?'up':'down';p.state='waiting';p.elapsed=0;const isNew=!this.dispatch.hasActiveCall(transfer,p.direction);p.assignedId=this.dispatch.assign(transfer,p.direction,{requiredFloor:p.destination});this.renderer.returnToQueue(p);this.layoutWaiting(transfer);if(isNew)this.onNewHallCall({floor:transfer,direction:p.direction,source:'transfer'});this.log(`乗客${p.id}：${transfer}Fで${p.assignedId}号機へ乗り換え待ち`);}else{this.renderer.remove(p);this.passengers.splice(this.passengers.indexOf(p),1);this.log(`乗客${p.id}：${p.destination}Fへ歩いて降車（${unit.id}号機 ${this.countIn(unit.id)}/${this.config.capacity}人）`);}}
      }
    }
  }
  get stats(){const cars=Object.fromEntries([...this.bank.units.keys()].map(id=>[id,{count:this.countIn(id),capacity:this.config.capacity,full:this.isFull(id)}]));return {waiting:this.passengers.filter(p=>p.state==='waiting'||p.state==='approaching').length,boarding:this.passengers.filter(p=>p.state==='boarding'||p.state==='exiting').length,riding:[...this.riders.values()].reduce((sum,ids)=>sum+ids.size,0),total:this.passengers.length,cars};}
  dispose(){this.renderer.dispose();this.passengers=[];this.riders.clear();}
}
