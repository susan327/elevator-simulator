class ElevatorApp {
  constructor(){
    if(!window.THREE){document.getElementById('loading').textContent='Three.jsの読込に失敗しました。インターネット接続を確認してください。';return;}
    this.playerFloor=1;this.inside=false;this.audio=new AudioManager();this.boardingCloseTimer=null;this.clock=new SimulationClock();this.config=new ElevatorSystemConfig();this.settingsStore=new DesignSettingsStore();this.restoreDesignSettings();
    this.sceneManager=new SceneManager(document.getElementById('viewport'));this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.createSimulation();this.ui=new UIController(this);this.bind3DInput();document.addEventListener('pointerdown',()=>this.audio.unlock(),{capture:true});
    this.designTimer=null;this.lastRender=0;this.frameInterval=1000/30;this.fpsFrames=0;this.fpsTime=performance.now();this.displayFps=0;this.lastVisualSignature='';
    document.getElementById('loading').remove();this.log('v2.4起動。運行ロジック・着床・自動閉扉改善版');requestAnimationFrame(t=>this.loop(t));
  }
  createSimulation(){
    this.geometryConfig=new ElevatorGeometryConfig(this.config);this.building=new BuildingBuilder(this.sceneManager.scene,{floors:this.config.floors,floorHeight:this.config.floorHeight,geometryConfig:this.geometryConfig,floorService:this.config.floorService});
    this.car=new ElevatorCar(this.sceneManager.scene,this.building,this.geometryConfig);this.doors=new DoorController(this.car,this.building);this.calls=new CallController(this.config.floorService);
    this.elevator=new ElevatorController(this.car,this.doors,this.calls,this.building,t=>this.log(t),this.config,this.audio);this.camera=new CameraController(this.sceneManager,this.building,this.car);this.camera.setHall(1);
  }
  restoreDesignSettings(){const saved=this.settingsStore.load();if(!saved)return;if(saved.useOffice30)this.config.applyBuildingPreset('office30');else if(!this.config.restore(saved.data))this.config.reset();if(saved.migrated)this.saveDesignSettings();}
  saveDesignSettings(){this.settingsStore.save(this.config.snapshot());}
  bind3DInput(){
    const viewport=document.getElementById('viewport');
    viewport.addEventListener('pointerdown',event=>{
      this.audio.unlock();const rect=viewport.getBoundingClientRect();this.pointer.x=((event.clientX-rect.left)/rect.width)*2-1;this.pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
      this.raycaster.setFromCamera(this.pointer,this.camera.camera);
      const objects=this.inside?(this.car.interactiveObjects||[]):(this.building.interactiveObjects||[]);
      const hit=this.raycaster.intersectObjects(objects,false)[0];if(hit?.object?.userData?.interaction){this.press3DButton(hit.object);this.handle3DInteraction(hit.object.userData.interaction);}
    });
  }
  press3DButton(button){
    const data=button.userData,label=data.labelMesh;if(data.restZ===undefined)data.restZ=button.position.z;if(label&&data.labelRestZ===undefined)data.labelRestZ=label.position.z;
    clearTimeout(data.pressTimer);button.position.z=data.restZ-.018;if(label)label.position.z=data.labelRestZ-.018;this.sceneManager.needsRender=true;
    data.pressTimer=setTimeout(()=>{button.position.z=data.restZ;if(label)label.position.z=data.labelRestZ;this.sceneManager.needsRender=true;},140);
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
    if(this.inside)for(const f of this.config.servedFloors)this.car.setCarCallLight(f,activeFloors.has(f));
    else{
      const f=this.playerFloor,now=performance.now(),arrivalActive=this.elevator.arrivalFloor===f&&now<this.elevator.arrivalFlashUntil,blinkOn=Math.floor(now/250)%2===0;
      for(const direction of ['up','down']){
        const queued=this.calls.queue.some(x=>x.floor===f&&x.direction===direction);
        const sameFloor=this.elevator.state==='SAME_FLOOR_RESPONSE'&&Math.round(this.elevator.position)===f&&this.elevator.sameFloorDirection===(direction==='up'?1:-1);
        const arriving=arrivalActive&&this.elevator.arrivalDirection===(direction==='up'?1:-1);
        this.building.setHallCallLight(f,direction,arriving?blinkOn:(queued||sameFloor),arriving);
      }
    }
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
    const result=this.config.validate();this.ui.updateValidation();if(!result.ok)return;this.saveDesignSettings();
    if(kind==='motion'){this.elevator.applyMotion(this.config);this.ui.update();return;}
    clearTimeout(this.designTimer);this.designTimer=setTimeout(()=>this.rebuildFromDesign(),kind==='building'?420:180);
  }
  rebuildFromDesign(){
    const result=this.config.validate();if(!result.ok)return;
    this.inside=false;this.boardingCloseTimer=null;this.playerFloor=1;this.destroySimulation();this.createSimulation();this.lastVisualSignature='';this.ui.buildDynamicFloors();this.ui.updateDesignValues();this.ui.updateValidation();
    this.log(`リアルタイム再生成：${this.config.floors}階・${this.config.capacity}人・最高${this.config.maxSpeed.toFixed(2)}m/s`);
  }
  resetDesign(){this.config.reset();this.saveDesignSettings();this.ui.updateDesignValues();this.ui.updateValidation();this.scheduleDesignUpdate('building');}
  loop(now){
    requestAnimationFrame(t=>this.loop(t));
    if(now-this.lastRender<this.frameInterval)return;
    const elapsed=now-this.lastRender;this.lastRender=now-(elapsed%this.frameInterval);
    const dt=this.clock.tick(now);
    const steps=Math.max(1,Math.min(12,Math.ceil(dt.sim/(1/60))));const step=dt.sim/steps;for(let i=0;i<steps;i++)this.elevator.update(step);
    this.camera.update();this.audio.updateMotor(this.elevator.velocity,this.elevator.acceleration,this.elevator.direction,this.config.motionPreset,this.config.maxSpeed,this.inside);this.car.setTravelIndicator(this.elevator.position,this.elevator.direction);this.building.setTravelIndicator(this.elevator.position,this.elevator.direction);this.sync3DButtonLights();this.ui.update();
    const flashPhase=performance.now()<this.elevator.arrivalFlashUntil?Math.floor(performance.now()/250)%2:-1;
    const visualSignature=`${this.elevator.position.toFixed(4)}|${this.doors.progress.toFixed(4)}|${this.camera.mode}|${this.camera.floor}|${this.inside}|${this.elevator.target}|${this.calls.queue.map(x=>`${x.floor}:${x.direction}`).join(',')}|${this.elevator.arrivalFloor}:${this.elevator.arrivalDirection}:${flashPhase}`;
    if(this.sceneManager.needsRender||visualSignature!==this.lastVisualSignature){this.sceneManager.render(this.camera.camera);this.lastVisualSignature=visualSignature;this.fpsFrames++;}
    if(now-this.fpsTime>=1000){this.displayFps=Math.round(this.fpsFrames*1000/(now-this.fpsTime));this.fpsFrames=0;this.fpsTime=now;this.ui.updatePerformance();}
  }
}
addEventListener('DOMContentLoaded',()=>window.elevatorApp=new ElevatorApp());
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('../service-worker.js'));
