import * as THREE from 'three';
import { AudioManager } from './audio/AudioManager.js';
import { ElevatorSystemConfig } from './config/ElevatorSystemConfig.js';
import { SimulationClock } from './core/SimulationClock.js';
import { SceneManager } from './core/SceneManager.js';
import { CameraController } from './core/CameraController.js';
import { BuildingBuilder } from './world/BuildingBuilder.js';
import { ElevatorGeometryConfig } from './elevator/ElevatorGeometryConfig.js';
import { ElevatorCar } from './elevator/ElevatorCar.js';
import { DoorController } from './elevator/DoorController.js';
import { CallController } from './control/CallController.js';
import { ElevatorController } from './elevator/ElevatorController.js';
import { UIController } from './ui/UIController.js';

class ElevatorApp {
  constructor(){
    this.playerFloor=1;this.inside=false;this.audio=new AudioManager();this.boardingCloseTimer=null;this.clock=new SimulationClock();this.config=new ElevatorSystemConfig();
    this.sceneManager=new SceneManager(document.getElementById('viewport'));this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.createSimulation();this.ui=new UIController(this);this.bind3DInput();
    this.designTimer=null;this.lastRender=0;this.frameInterval=1000/30;this.fpsFrames=0;this.fpsTime=performance.now();this.displayFps=0;
    document.getElementById('loading').remove();this.log('v2.4起動。運行ロジック・着床・自動閉扉改善版');requestAnimationFrame(t=>this.loop(t));
  }
  createSimulation(){
    this.geometryConfig=new ElevatorGeometryConfig(this.config);this.building=new BuildingBuilder(this.sceneManager.scene,{floors:this.config.floors,floorHeight:this.config.floorHeight,geometryConfig:this.geometryConfig,floorService:this.config.floorService});
    this.car=new ElevatorCar(this.sceneManager.scene,this.building,this.geometryConfig);this.doors=new DoorController(this.car,this.building);this.calls=new CallController(this.config.floorService);
    this.elevator=new ElevatorController(this.car,this.doors,this.calls,this.building,t=>this.log(t),this.config,this.audio);this.camera=new CameraController(this.sceneManager,this.building,this.car);this.camera.setHall(1);
  }
  bind3DInput(){
    const viewport=document.getElementById('viewport');
    viewport.addEventListener('pointerdown',event=>{
      this.audio.unlock();const rect=viewport.getBoundingClientRect();this.pointer.x=((event.clientX-rect.left)/rect.width)*2-1;this.pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
      this.raycaster.setFromCamera(this.pointer,this.camera.camera);
      const objects=this.inside?(this.car.interactiveObjects||[]):(this.building.interactiveObjects||[]);
      const hit=this.raycaster.intersectObjects(objects,false)[0];if(hit?.object?.userData?.interaction)this.handle3DInteraction(hit.object.userData.interaction);
    });
  }
  handle3DInteraction(action){
    if(action.type==='hallCall'){
      if(Number(action.floor)!==this.playerFloor){this.playerFloor=Number(action.floor);this.camera.setHall(this.playerFloor);}
      this.call(action.direction);return;
    }
    if(action.type==='carCall'){if(this.inside)this.selectFloor(Number(action.floor));return;}
    if(action.type==='doorOpen'){this.openDoor();return;}if(action.type==='doorClose')this.closeDoor();
  }
  sync3DButtonLights(){
    const activeFloors=new Set([this.elevator.target,...this.calls.queue.map(x=>x.floor)].filter(x=>x!=null));
    for(const f of this.config.servedFloors)this.car.setCarCallLight(f,activeFloors.has(f));
    for(let f=1;f<=this.config.floors;f++){this.building.setHallCallLight(f,'up',this.calls.queue.some(x=>x.floor===f&&x.direction==='up'));this.building.setHallCallLight(f,'down',this.calls.queue.some(x=>x.floor===f&&x.direction==='down'));}
  }
  destroySimulation(){if(this.car){this.car.disposeObject(this.car.group);this.sceneManager.scene.remove(this.car.group);}if(this.building)this.building.dispose();}
  log(text){const el=document.getElementById('log'),time=new Date().toLocaleTimeString('ja-JP',{hour12:false});const lines=(`[${time}] ${text}\n`+el.textContent).split('\n').slice(0,40);el.textContent=lines.join('\n');}
  call(direction){this.audio.unlock();if(!this.config.isServed(this.playerFloor)){this.log(`${this.playerFloor}Fは通過階のため呼び出せません`);return;}this.audio.playCall();this.elevator.request(this.playerFloor,direction);this.log(`${this.playerFloor}F ${direction==='up'?'上':'下'}呼び・呼出音`);}
  canEnter(){const floorError=Math.abs(this.elevator.position-this.playerFloor),stopped=Math.abs(this.elevator.velocity)<.035,arrivalState=['ARRIVAL_WAIT','DOOR','IDLE'].includes(this.elevator.state);return !this.inside&&floorError<.08&&stopped&&arrivalState&&this.doors.isBoardable();}
  enter(){this.audio.unlock();if(!this.canEnter()){this.log('まだ乗車できません。停止とドア開を待ってください');return;}this.inside=true;this.camera.setCabin();this.boardingCloseTimer=null;this.elevator.extendDoorHold(3.0);this.log(`${this.playerFloor}Fから乗車`);}
  exit(){if(!this.inside||!this.doors.isBoardable())return;this.playerFloor=Math.round(this.elevator.position);this.inside=false;this.boardingCloseTimer=null;this.camera.setHall(this.playerFloor);this.log(`${this.playerFloor}Fで降車`);}
  selectFloor(floor){this.audio.unlock();if(!this.inside)return;if(!this.config.isServed(floor)){this.log(`${floor}Fは通過階です`);return;}this.boardingCloseTimer=null;this.elevator.request(floor,'car');this.doors.close();this.elevator.state='DOOR';this.log(`かご呼び ${floor}F`);}
  openDoor(){if(this.inside&&Math.abs(this.elevator.position-Math.round(this.elevator.position))<.08&&this.elevator.commandOpen())this.log('開ボタン・保持時間延長');}
  closeDoor(){if(this.inside){this.elevator.commandClose();this.log('閉ボタン');}}
  jump(floor){if(this.inside)return;this.boardingCloseTimer=null;this.doors.forceClosed();this.playerFloor=floor;this.camera.setHall(floor);this.log(`試験用移動 ${floor}F`);}
  setSpeed(v){this.clock.setScale(v);this.log(`時間倍率 ×${v}`);}
  scheduleDesignUpdate(kind='geometry'){
    const result=this.config.validate();this.ui.updateValidation();if(!result.ok)return;
    if(kind==='motion'){this.elevator.applyMotion(this.config);this.ui.update();return;}
    clearTimeout(this.designTimer);this.designTimer=setTimeout(()=>this.rebuildFromDesign(),kind==='building'?420:180);
  }
  rebuildFromDesign(){
    const result=this.config.validate();if(!result.ok)return;
    this.inside=false;this.boardingCloseTimer=null;this.playerFloor=1;this.destroySimulation();this.createSimulation();this.ui.buildDynamicFloors();this.ui.updateDesignValues();this.ui.updateValidation();
    this.log(`リアルタイム再生成：${this.config.floors}階・${this.config.capacity}人・最高${this.config.maxSpeed.toFixed(2)}m/s`);
  }
  resetDesign(){this.config.reset();this.ui.updateDesignValues();this.ui.updateValidation();this.scheduleDesignUpdate('building');}
  loop(now){
    requestAnimationFrame(t=>this.loop(t));
    if(now-this.lastRender<this.frameInterval)return;
    const elapsed=now-this.lastRender;this.lastRender=now-(elapsed%this.frameInterval);
    const dt=this.clock.tick(now);
    const steps=Math.max(1,Math.min(12,Math.ceil(dt.sim/(1/60))));const step=dt.sim/steps;for(let i=0;i<steps;i++)this.elevator.update(step);
    this.camera.update();this.sync3DButtonLights();this.ui.update();this.sceneManager.render(this.camera.camera);
    this.fpsFrames++;if(now-this.fpsTime>=1000){this.displayFps=Math.round(this.fpsFrames*1000/(now-this.fpsTime));this.fpsFrames=0;this.fpsTime=now;this.ui.updatePerformance();}
  }
}
addEventListener('DOMContentLoaded',()=>new ElevatorApp());
