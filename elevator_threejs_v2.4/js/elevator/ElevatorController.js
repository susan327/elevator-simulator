class ElevatorController {
  constructor(car,doors,calls,building,log,motionConfig,audio){
    this.car=car;this.doors=doors;this.calls=calls;this.building=building;this.log=log;this.audio=audio;
    this.position=1;this.velocity=0;this.acceleration=0;this.target=null;this.state='IDLE';
    this.arrivalWait=0;this.boardingLogged=false;this.plan=null;this.planElapsed=0;
    this.planStartFloor=1;this.planDirection=0;this.serviceDirection=0;this.planner=new MotionPlanner(motionConfig);this.currentRequestDirection='car';this.arrivalSoundPlayed=false;this.announcedArrivalDirection=0;this.arrivalFloor=null;this.arrivalDirection=0;this.arrivalFlashUntil=0;this.arrivalLeadSeconds=4;this.sameFloorTimer=0;this.sameFloorArrivalPlayed=false;this.sameFloorDirection=0;this.sameFloorOpenDelay=.80;this.sameFloorArrivalDelay=.80;this.doorHoldDuration=4.5;this.doorHoldTimer=0;
    this.applyMotion(motionConfig);this.sync();
  }
  applyMotion(c){
    this.maxSpeed=c.maxSpeed;this.accel=c.acceleration;this.decel=c.deceleration;
    this.accelJerk=c.accelJerk??c.jerk??.6;this.decelJerk=c.decelJerk??c.jerk??.5;
    this.landingSpeed=c.landingSpeed??.03;this.landingDistance=c.landingDistance??.4;
    if(this.planner)this.planner.applyConfig(c);
  }
  request(floor,direction){
    if(floor<1||floor>this.building.floors)return;if(this.building.floorService&&!this.building.floorService.isServed(floor)){this.log(`${floor}Fは通過階です`);return;}
    if(Math.abs(this.position-floor)<.002&&this.target===null&&Math.abs(this.velocity)<.001){
      if(this.doors.isOpen()||this.doors.isBoardable()||this.state==='SAME_FLOOR_RESPONSE')return;
      this.startSameFloorResponse(floor,direction);return;
    }
    this.calls.request(floor,direction);if(!this.doors.isClosed())this.doors.close();
  }
  resolveDepartureDirection(floor,requestedDirection=0){
    const numericFloor=Number(floor);
    // 端階は次に進める方向が一意なので、呼び方向や走行方向より優先する。
    if(numericFloor<=1)return 1;
    if(numericFloor>=this.building.floors)return -1;
    if(requestedDirection==='up')return 1;
    if(requestedDirection==='down')return -1;
    const numeric=Number(requestedDirection);
    return Number.isFinite(numeric)&&numeric!==0?Math.sign(numeric):0;
  }
  startSameFloorResponse(floor,direction){
    this.position=Number(floor);this.velocity=0;this.acceleration=0;this.target=null;this.plan=null;this.planElapsed=0;
    this.sameFloorTimer=0;this.sameFloorArrivalPlayed=false;
    this.sameFloorDirection=this.resolveDepartureDirection(floor,direction)||1;
    this.state='SAME_FLOOR_RESPONSE';this.boardingLogged=false;this.sync();
    this.log(`${floor}F同一階応答：0.8秒後に${this.sameFloorDirection>0?'上':'下'}方向到着音＋開扉`);
  }
  beginArrival(floor){
    this.position=Number(floor);this.velocity=0;this.acceleration=0;this.target=null;
    this.plan=null;this.planElapsed=0;this.state='ARRIVAL_WAIT';this.arrivalWait=1.5;this.boardingLogged=false;
    this.startArrivalFlash(this.position,this.announcedArrivalDirection||this.resolveDepartureDirection(this.position,this.currentRequestDirection)||this.planDirection||1);
    this.calls.clearFloor(this.position);this.sync();this.log(`${this.position}Fに滑らかに定位置停止`);
  }
  startArrivalFlash(floor,direction){this.arrivalFloor=Number(floor);this.arrivalDirection=Math.sign(direction)||1;this.arrivalFlashUntil=performance.now()+3000;}
  extendDoorHold(seconds=this.doorHoldDuration){this.doorHoldTimer=Math.max(this.doorHoldTimer,seconds);}
  commandOpen(){if(Math.abs(this.velocity)>.035)return false;this.doors.open(Math.round(this.position));this.state='DOOR';this.boardingLogged=false;this.extendDoorHold();return true;}
  commandClose(){this.doorHoldTimer=0;this.doors.close();this.state='DOOR';return true;}
  createPlan(target){
    this.planStartFloor=this.position;this.planDirection=Math.sign(target-this.position);
    const startY=this.building.floorY(this.position),targetY=this.building.floorY(target);const distance=Math.abs(targetY-startY);
    this.plan=this.planner.create(distance);this.planElapsed=0;this.arrivalSoundPlayed=false;this.announcedArrivalDirection=0;
    const accelDistance=this.plan.dAccel.toFixed(1),decelDistance=this.plan.dDecel.toFixed(1);
    this.log(`運転曲線生成：最高${this.plan.peakSpeed.toFixed(2)}m/s・加速${accelDistance}m・減速${decelDistance}m・着床${this.plan.dLanding.toFixed(2)}m`);
  }
  update(dt){
    this.doors.update(dt);
    if(this.state==='SAME_FLOOR_RESPONSE'){
      this.sameFloorTimer+=dt;
      if(!this.sameFloorArrivalPlayed&&this.sameFloorTimer>=this.sameFloorArrivalDelay){
        this.audio?.playArrival(this.sameFloorDirection);this.sameFloorArrivalPlayed=true;this.startArrivalFlash(this.position,this.sameFloorDirection);
        this.log(`同一階到着音：${this.sameFloorDirection>0?'E♭→G':'G→E♭'}（呼出音から${this.sameFloorArrivalDelay.toFixed(2)}秒後）`);
      }
      if(this.sameFloorTimer>=this.sameFloorOpenDelay){
        // 到着音と開扉を同じ0.8秒時点で開始する。
        if(!this.sameFloorArrivalPlayed){
          this.audio?.playArrival(this.sameFloorDirection);this.sameFloorArrivalPlayed=true;this.startArrivalFlash(this.position,this.sameFloorDirection);
          this.log(`同一階到着音：${this.sameFloorDirection>0?'E♭→G':'G→E♭'}（呼出音から${this.sameFloorOpenDelay.toFixed(2)}秒後）`);
        }
        this.doors.open(this.position);this.doorHoldTimer=this.doorHoldDuration;this.state='DOOR';this.log('同一階応答：0.8秒でドア開開始');
      }
      this.sync();return;
    }
    if(this.state==='ARRIVAL_WAIT'){
      this.arrivalWait-=dt;if(this.arrivalWait<=0){this.doors.open(this.position);this.doorHoldTimer=this.doorHoldDuration;this.state='DOOR';this.log('ドア開開始');}
      this.sync();return;
    }
    if(this.state==='DOOR'){
      if(this.doors.isOpen()&&!this.boardingLogged){this.boardingLogged=true;this.extendDoorHold();this.log(`ドア全開・乗降できます（${this.doorHoldDuration.toFixed(1)}秒保持）`);}
      if(this.doors.isOpen()&&this.doorHoldTimer>0){this.doorHoldTimer=Math.max(0,this.doorHoldTimer-dt);if(this.doorHoldTimer===0){this.doors.close();this.log('ドア保持時間終了・自動閉扉開始');}}
      if(this.doors.isClosed())this.state='IDLE';this.sync();return;
    }
    if(!this.doors.isClosed()){this.state='DOOR';this.sync();return;}
    if(this.target===null){
      const request=this.calls.next(this.position,this.serviceDirection);
      this.target=request?.floor??null;
      this.currentRequestDirection=request?.direction??'car';
      if(this.target!==null){this.serviceDirection=Math.sign(this.target-this.position)||this.serviceDirection;this.createPlan(this.target);}
    }
    if(this.target===null){
      this.velocity=0;this.acceleration=0;this.state='IDLE';this.sync();return;
    }
    if(!this.plan)this.createPlan(this.target);

    this.planElapsed=Math.min(this.plan.totalTime,this.planElapsed+dt);
    const secondsUntilDoorOpen=(this.plan.totalTime-this.planElapsed)+1.5;
    if(!this.arrivalSoundPlayed&&secondsUntilDoorOpen<=this.arrivalLeadSeconds){
      let nextDirection=this.calls.nextDirection(this.target,this.currentRequestDirection);
      if(nextDirection===0)nextDirection=this.planDirection;
      nextDirection=this.resolveDepartureDirection(this.target,nextDirection)||this.planDirection||1;
      this.audio?.playArrival(nextDirection);this.arrivalSoundPlayed=true;this.announcedArrivalDirection=nextDirection;
      this.log(`到着予告音：このあと${nextDirection>0?'上':'下'}方向（開扉約${secondsUntilDoorOpen.toFixed(1)}秒前）`);
    }
    const sample=this.planner.sample(this.plan,this.planElapsed);
    this.velocity=sample.velocity;this.acceleration=sample.acceleration;this.state=sample.phase;
    const floorsMoved=(sample.distance/this.building.floorHeight)*this.planDirection;
    this.position=this.planStartFloor+floorsMoved;

    if(this.planElapsed>=this.plan.totalTime-1e-7){
      // 解析曲線の終端は速度・加速度とも0。ここでの座標確定は浮動小数点誤差のみ。
      this.position=this.target;this.velocity=0;this.acceleration=0;this.sync();this.beginArrival(this.target);return;
    }
    this.sync();
  }
  sync(){this.car.setFloorPosition(this.position);}
  get direction(){return this.target===null?0:Math.sign(this.target-this.position);}
}
