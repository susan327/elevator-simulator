class CallController {
  constructor(floorService=null){this.queue=[];this.floorService=floorService;}
  request(floor,direction='car'){floor=Number(floor);if(this.floorService&&!this.floorService.isServed(floor))return false;if(!this.queue.some(x=>x.floor===floor))this.queue.push({floor,direction});return true;
  }
  clearFloor(floor){this.queue=this.queue.filter(x=>x.floor!==floor);}
  next(position){
    if(!this.queue.length)return null;
    this.queue.sort((a,b)=>Math.abs(a.floor-position)-Math.abs(b.floor-position));
    return this.queue.shift();
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
