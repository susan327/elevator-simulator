class MotionPlanner {
  constructor(config){this.applyConfig(config);}
  applyConfig(c){
    this.maxSpeed=c.maxSpeed;
    this.accel=Math.max(.05,c.acceleration);
    this.decel=Math.max(.05,c.deceleration);
    this.accelJerk=Math.max(.05,c.accelJerk??.6);
    this.decelJerk=Math.max(.05,c.decelJerk??.5);
    this.landingSpeed=Math.max(.005,c.landingSpeed??.03);
    this.landingDistance=Math.max(.05,c.landingDistance??.4);
    this.maxLandingTime=Math.max(.8,c.maxLandingTime??3.2);
    this.maxLandingDeceleration=Math.max(.1,c.maxLandingDeceleration??.32);
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
    const dLanding=Math.min(this.landingDistance,D*.35);
    // quintic減速の最大減速度を全プリセットで揃え、停止直前の衝撃感を抑える。
    const comfortTime=dLanding>0?Math.sqrt(3.75*dLanding/this.maxLandingDeceleration):0;
    const landingTime=Math.min(this.maxLandingTime,comfortTime);
    const landingSpeed=Math.min(this.maxSpeed,Math.max(this.landingSpeed,landingTime>0?2*dLanding/landingTime:0));
    let peak=this.maxSpeed;
    let parts=this.distancesFor(peak);
    const mainDistance=Math.max(0,D-dLanding);
    const measure=speed=>{const a=this.rampTime(speed,this.accel,this.accelJerk),delta=Math.max(0,speed-landingSpeed),d=this.rampTime(delta,this.decel,this.decelJerk);return {tAccel:a,tDecel:d,dAccel:.5*speed*a,dDecel:.5*(speed+landingSpeed)*d};};
    parts=measure(peak);
    if(parts.dAccel+parts.dDecel>mainDistance){
      let lo=landingSpeed,hi=this.maxSpeed;
      for(let i=0;i<48;i++){
        const mid=(lo+hi)/2,p=measure(mid);
        if(p.dAccel+p.dDecel>mainDistance)hi=mid;else lo=mid;
      }
      peak=lo;parts=measure(peak);
    }
    const dCruise=Math.max(0,mainDistance-parts.dAccel-parts.dDecel);
    const tCruise=peak>.0001?dCruise/peak:0;
    const tLanding=landingSpeed>.0001?2*dLanding/landingSpeed:0;
    return {
      distance:D,peakSpeed:peak,landingSpeed,
      tAccel:parts.tAccel,tCruise,tDecel:parts.tDecel,tLanding,
      dAccel:parts.dAccel,dCruise,dDecel:parts.dDecel,dLanding,
      totalTime:parts.tAccel+tCruise+parts.tDecel+tLanding
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
    if(t<=plan.tAccel+plan.tCruise+plan.tDecel){
    const td=t-plan.tAccel-plan.tCruise;
    const u=plan.tDecel>0?td/plan.tDecel:1;
    const delta=plan.peakSpeed-plan.landingSpeed;
    return {
      distance:plan.dAccel+plan.dCruise+plan.landingSpeed*td+delta*plan.tDecel*(u-this.smoothIntegral(u)),
      velocity:plan.landingSpeed+delta*(1-this.smooth(u)),
      acceleration:-delta/plan.tDecel*this.smoothDerivative(u),phase:'DECELERATING'
    };
    }
    const tl=t-plan.tAccel-plan.tCruise-plan.tDecel,u=plan.tLanding>0?tl/plan.tLanding:1;
    return {distance:plan.dAccel+plan.dCruise+plan.dDecel+plan.landingSpeed*plan.tLanding*(u-this.smoothIntegral(u)),velocity:plan.landingSpeed*(1-this.smooth(u)),acceleration:-plan.landingSpeed/plan.tLanding*this.smoothDerivative(u),phase:'LANDING'};
  }
}
