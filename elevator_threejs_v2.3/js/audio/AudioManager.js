class AudioManager {
  constructor(){this.config=new ElevatorSoundConfig();this.synth=new ToneSynth(this.config);}
  unlock(){this.synth.unlock();}
  playCall(){this.synth.playCall();}
  playArrival(direction){if(direction!==0)this.synth.playArrival(direction);}
}
