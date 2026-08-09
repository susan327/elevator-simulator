class MotionPlanner {
  constructor(config){this.applyConfig(config);}
  applyConfig(c){
    this.maxSpeed=c.maxSpeed;
    this.accel=Math.max(.05,c.acceleration);
    this.decel=Math.max(.05,c.deceleration);
    this.accelJerk=Math.max(.05,c.accelJerk??.6);
    this.decelJerk=Math.max(.05,c.decelJerk??.5);
  }
  smooth(u){u=THREE.MathUtils.clamp(u,0,1);return 10*u**3-15*u**4+6*u**5;}
  smoothDerivative(u){u=THREE.MathUtils.clamp(u,0,1);return 30*u*u*(1-u)*(1-u);}
  smoothIntegral(u){u=THREE.MathUtils.clamp(u,0,1);return 2.5*u**4-3*u**5+u**6;}
  rampTime(speed,accel,jerk){
    // quintic速度ランプの最大加速度・最大ジャークを超えない時間。
    const byAccel=1.875*speed/Math.max(.05,accel);
    const byJerk=Math.sqrt(5.78*speed/Math.max(.05,jerk));
    return Math.max(.35,byAccel,byJerk);
  }
  distancesFor(speed){
    const tAccel=this.rampTime(speed,this.accel,this.accelJerk);
    const tDecel=this.rampTime(speed,this.decel,this.decelJerk);
    return {tAccel,tDecel,dAccel:.5*speed*tAccel,dDecel:.5*speed*tDecel};
  }
  create(distanceMeters){
    const D=Math.max(0,distanceMeters);
    let peak=this.maxSpeed;
    let parts=this.distancesFor(peak);
    if(parts.dAccel+parts.dDecel>D){
      let lo=0,hi=this.maxSpeed;
      for(let i=0;i<48;i++){
        const mid=(lo+hi)/2,p=this.distancesFor(mid);
        if(p.dAccel+p.dDecel>D)hi=mid;else lo=mid;
      }
      peak=lo;parts=this.distancesFor(peak);
    }
    const dCruise=Math.max(0,D-parts.dAccel-parts.dDecel);
    const tCruise=peak>.0001?dCruise/peak:0;
    return {
      distance:D,peakSpeed:peak,
      tAccel:parts.tAccel,tCruise,tDecel:parts.tDecel,
      dAccel:parts.dAccel,dCruise,dDecel:parts.dDecel,
      totalTime:parts.tAccel+tCruise+parts.tDecel
    };
  }
  sample(plan,time){
    const t=THREE.MathUtils.clamp(time,0,plan.totalTime);
    if(t<=plan.tAccel){
      const u=t/plan.tAccel;
      return {
        distance:plan.peakSpeed*plan.tAccel*this.smoothIntegral(u),
        velocity:plan.peakSpeed*this.smooth(u),
        acceleration:plan.peakSpeed/plan.tAccel*this.smoothDerivative(u),
        phase:'ACCELERATING'
      };
    }
    if(t<=plan.tAccel+plan.tCruise){
      const tc=t-plan.tAccel;
      return {distance:plan.dAccel+plan.peakSpeed*tc,velocity:plan.peakSpeed,acceleration:0,phase:'CRUISING'};
    }
    const td=t-plan.tAccel-plan.tCruise;
    const u=plan.tDecel>0?td/plan.tDecel:1;
    return {
      distance:plan.dAccel+plan.dCruise+plan.peakSpeed*plan.tDecel*(u-this.smoothIntegral(u)),
      velocity:plan.peakSpeed*(1-this.smooth(u)),
      acceleration:-plan.peakSpeed/plan.tDecel*this.smoothDerivative(u),
      phase:u>.82?'LANDING':'DECELERATING'
    };
  }
}
