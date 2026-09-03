export class DispatchController {
  constructor(bank){this.bank=bank;this.assignments=new Map();}
  key(floor,direction){return `${Number(floor)}:${direction}`;}
  score(unit,floor,direction){const e=unit.controller,distance=Math.abs(e.position-floor),busy=e.target!==null||e.calls.queue.length>0,travel=e.direction;if(!busy)return distance;const sameWay=travel!==0&&Math.sign(floor-e.position)===travel&&(direction==='up'?1:-1)===travel;return distance+(sameWay?1.5:8)+e.calls.queue.length*2;}
  isAssignmentActive(floor,direction,id=this.assignedTo(floor,direction)){const unit=id&&this.bank.get(id);if(!unit)return false;const e=unit.controller,queued=e.target===Number(floor)||e.calls.queue.some(x=>x.floor===Number(floor)&&x.direction===direction),responding=e.state==='SAME_FLOOR_RESPONSE'&&Math.round(e.position)===Number(floor),arriving=e.arrivalFloor===Number(floor)&&performance.now()<e.arrivalFlashUntil;return queued||responding||arriving;}
  hasActiveCall(floor,direction){return this.isAssignmentActive(floor,direction);}
  assign(floor,direction,{excludeIds=[]}={}){const key=this.key(floor,direction),excluded=new Set(excludeIds),current=this.assignments.get(key);if(current&&!excluded.has(current)&&this.isAssignmentActive(floor,direction,current))return current;const available=[...this.bank.units.values()].filter(unit=>!excluded.has(unit.id)),candidates=available.length?available:[...this.bank.units.values()],unit=candidates.sort((a,b)=>this.score(a,floor,direction)-this.score(b,floor,direction))[0];this.assignments.set(key,unit.id);unit.controller.request(floor,direction);return unit.id;}
  assignedTo(floor,direction){return this.assignments.get(this.key(floor,direction))||null;}
}
