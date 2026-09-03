import { ElevatorCar } from './ElevatorCar.js';
import { DoorController } from './DoorController.js';
import { CallController } from '../control/CallController.js';
import { ElevatorController } from './ElevatorController.js';

export class ElevatorBank {
  constructor(scene,building,geometryConfig,{config,audio,log,shouldPlayArrival}){
    this.building=building;this.units=new Map();
    for(const id of building.shaftIds){const car=new ElevatorCar(scene,building,geometryConfig,{id,shaftX:building.getShaftCenter(id)}),doors=new DoorController(car,building,id),calls=new CallController(building.floorService),controller=new ElevatorController(car,doors,calls,building,text=>log(`${id}号機：${text}`),config,audio,floor=>shouldPlayArrival?.(id,floor)??true);this.units.set(id,{id,car,doors,calls,controller});}
    this.activeId='A';const standbyFloor=Math.min(building.floors,Math.max(1,Math.ceil(building.floors/2))),b=this.get('B');b.controller.position=standbyFloor;b.doors.activeFloor=standbyFloor;b.controller.sync();building.setTravelIndicator(standbyFloor,0,'B');
  }
  get(id){return this.units.get(id);}
  get active(){return this.get(this.activeId);}
  setActive(id){if(this.units.has(id))this.activeId=id;return this.active;}
  applyMotion(config){for(const {controller} of this.units.values())controller.applyMotion(config);}
  isIdle(){return [...this.units.values()].every(({controller})=>controller.state==='IDLE');}
  update(dt){for(const unit of this.units.values())unit.controller.update(dt);}
  findBoardable(floor){return [...this.units.values()].find(({controller,doors})=>Math.abs(controller.position-floor)<.08&&Math.abs(controller.velocity)<.035&&doors.isBoardable())||null;}
  dispose(){for(const {car} of this.units.values()){car.disposeObject(car.group);car.scene.remove(car.group);}this.units.clear();}
}
