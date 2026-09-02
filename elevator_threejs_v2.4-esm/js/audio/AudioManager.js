import { ElevatorSoundConfig } from './ElevatorSoundConfig.js';
import { ToneSynth } from './ToneSynth.js';
import { MotorSoundSynth } from './MotorSoundSynth.js';

export class AudioManager {
  constructor(){this.config=new ElevatorSoundConfig();this.synth=new ToneSynth(this.config);this.motor=new MotorSoundSynth();this.context=null;}
  unlock(){
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return Promise.resolve(false);
    if(!this.context)this.context=new Ctx();
    this.synth.context=this.context;this.motor.context=this.context;
    this.synth.ensure();this.motor.ensure();
    return this.context.state==='suspended'?this.context.resume().then(()=>true).catch(()=>false):Promise.resolve(true);
  }
  playCall(){this.synth.playCall();}
  playArrival(direction){if(direction!==0)this.synth.playArrival(direction);}
  updateMotor(velocity,acceleration,direction,motionPreset,maxSpeed,audible){this.motor.update(velocity,acceleration,direction,motionPreset,maxSpeed,audible);}
}
