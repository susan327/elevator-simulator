import { ElevatorSoundConfig } from './ElevatorSoundConfig.js';
import { ToneSynth } from './ToneSynth.js';
import { MotorSoundSynth } from './MotorSoundSynth.js';

export class AudioManager {
  constructor(){this.config=new ElevatorSoundConfig();this.synth=new ToneSynth(this.config);this.motor=new MotorSoundSynth();}
  unlock(){this.synth.unlock();this.motor.unlock();}
  playCall(){this.synth.playCall();}
  playArrival(direction){if(direction!==0)this.synth.playArrival(direction);}
  updateMotor(velocity,acceleration,direction,motionPreset,maxSpeed,audible){this.motor.update(velocity,acceleration,direction,motionPreset,maxSpeed,audible);}
}
