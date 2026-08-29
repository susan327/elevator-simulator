class CallController {
  constructor(floorService=null){this.queue=[];this.floorService=floorService;}
  request(floor,direction='car'){floor=Number(floor);if(this.floorService&&!this.floorService.isServed(floor))return false;if(!this.queue.some(x=>x.floor===floor&&x.direction===direction))this.queue.push({floor,direction});return true;
  }
  clearFloor(floor){this.queue=this.queue.filter(x=>x.floor!==floor);}
  next(position,travelDirection=0){
    if(!this.queue.length)return null;
    const dir=Math.sign(travelDirection);let candidates=[];
    if(dir>0)candidates=this.queue.filter(x=>x.floor>=position-.001&&(x.direction==='up'||x.direction==='car')).sort((a,b)=>a.floor-b.floor);
    if(dir<0)candidates=this.queue.filter(x=>x.floor<=position+.001&&(x.direction==='down'||x.direction==='car')).sort((a,b)=>b.floor-a.floor);
    if(!candidates.length&&dir>0)candidates=this.queue.filter(x=>x.floor>=position-.001).sort((a,b)=>a.floor-b.floor);
    if(!candidates.length&&dir<0)candidates=this.queue.filter(x=>x.floor<=position+.001).sort((a,b)=>b.floor-a.floor);
    const selected=candidates[0]||[...this.queue].sort((a,b)=>Math.abs(a.floor-position)-Math.abs(b.floor-position))[0];
    this.queue.splice(this.queue.indexOf(selected),1);return selected;
  }
  nextDirection(position,fallback=0){
    if(this.queue.length){
      const sorted=[...this.queue].sort((a,b)=>Math.abs(a.floor-position)-Math.abs(b.floor-position));
      const next=sorted[0];
      if(next.direction==='up')return 1;
      if(next.direction==='down')return -1;
      const delta=next.floor-position;if(Math.abs(delta)>.001)return Math.sign(delta);
    }
    if(fallback==='up')return 1;
    if(fallback==='down')return -1;
    return Number(fallback)||0;
  }
  reset(){this.queue=[];}
}
