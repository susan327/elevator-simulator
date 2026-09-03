import * as THREE from 'three';

export class DoorController {
  constructor(car,building,elevatorId='A'){
    this.car=car;this.building=building;this.elevatorId=elevatorId;this.progress=0;this.target=0;this.duration=3.6;this.activeFloor=1;
    this.startProgress=0;this.elapsed=0;this.motionDuration=0;this.apply();
  }
  smootherstep(t){t=THREE.MathUtils.clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);}
  apply(){this.car.setDoorOpen(this.progress);this.building.setHallDoorOpen(this.activeFloor,this.progress,this.elevatorId);}
  animateTo(target){
    target=THREE.MathUtils.clamp(target,0,1);
    if(Math.abs(target-this.progress)<.001){this.target=target;this.progress=target;this.apply();return;}
    this.startProgress=this.progress;this.target=target;this.elapsed=0;
    this.motionDuration=Math.max(.25,this.duration*Math.abs(this.target-this.startProgress));
  }
  open(floor){
    const nextFloor=Math.max(1,Math.min(this.building.floors,Math.round(floor)));
    if(this.activeFloor!==nextFloor)this.building.setHallDoorOpen(this.activeFloor,0,this.elevatorId);
    this.activeFloor=nextFloor;this.animateTo(1);
  }
  close(){this.animateTo(0);}
  forceClosed(){this.building.setHallDoorOpen(this.activeFloor,0,this.elevatorId);this.progress=0;this.target=0;this.elapsed=0;this.motionDuration=0;this.apply();}
  isOpen(){return this.progress>=.985;}
  isBoardable(){return this.progress>=.78&&this.target===1;}
  isClosed(){return this.progress<=.005&&this.target===0;}
  isMoving(){return this.motionDuration>0&&this.elapsed<this.motionDuration;}
  update(dt){
    if(!this.isMoving()){this.progress=this.target;this.apply();return;}
    this.elapsed=Math.min(this.motionDuration,this.elapsed+dt);
    const eased=this.smootherstep(this.elapsed/this.motionDuration);
    this.progress=THREE.MathUtils.lerp(this.startProgress,this.target,eased);
    if(this.elapsed>=this.motionDuration){this.progress=this.target;this.motionDuration=0;}
    this.apply();
  }
}
