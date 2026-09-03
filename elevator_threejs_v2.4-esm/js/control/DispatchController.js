export class DispatchController {
  constructor(bank){this.bank=bank;this.assignments=new Map();}
  key(floor,direction){return `${Number(floor)}:${direction}`;}
  score(unit,floor,direction){const e=unit.controller,distance=Math.abs(e.position-floor),busy=e.target!==null||e.calls.queue.length>0,travel=e.direction;if(!busy)return distance;const sameWay=travel!==0&&Math.sign(floor-e.position)===travel&&(direction==='up'?1:-1)===travel;return distance+(sameWay?1.5:8)+e.calls.queue.length*2;}
  assign(floor,direction,{excludeIds=[]}={}){const excluded=new Set(excludeIds),available=[...this.bank.units.values()].filter(unit=>!excluded.has(unit.id)),candidates=available.length?available:[...this.bank.units.values()],unit=candidates.sort((a,b)=>this.score(a,floor,direction)-this.score(b,floor,direction))[0];this.assignments.set(this.key(floor,direction),unit.id);unit.controller.request(floor,direction);return unit.id;}
  assignedTo(floor,direction){return this.assignments.get(this.key(floor,direction))||null;}
}
