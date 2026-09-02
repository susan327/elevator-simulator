export class ToneSynth {
  constructor(config){this.config=config;this.context=null;this.noteMap={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};}
  ensure(){
    if(!this.context){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;this.context=new Ctx();}
    if(this.context.state!=='running')this.context.resume().catch(()=>{});return this.context;
  }
  unlock(){this.ensure();}
  frequency(note,cents=0){const m=this.config.master,midi=12*(m.octave+1)+this.noteMap[note];return 440*Math.pow(2,(midi-69+(m.pitchCents+cents)/100)/12);}
  tone(note,start,duration,release,volume,cents=0){
    const ctx=this.ensure();if(!ctx)return;const osc=ctx.createOscillator(),gain=ctx.createGain(),m=this.config.master;
    osc.type=m.waveform;osc.frequency.setValueAtTime(this.frequency(note,cents),start);
    const attack=Math.min(m.attackSeconds,Math.max(.005,duration*.45)),sustainEnd=start+duration,stop=sustainEnd+release;
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,m.volume*volume),start+attack);
    gain.gain.setValueAtTime(Math.max(.0002,m.volume*volume),sustainEnd);gain.gain.exponentialRampToValueAtTime(.0001,stop);
    osc.connect(gain).connect(ctx.destination);osc.start(start);osc.stop(stop+.03);
  }
  playCall(){const ctx=this.ensure();if(!ctx)return;const c=this.config.call,t=ctx.currentTime+.02;c.notes.forEach((n,i)=>this.tone(n,t,c.durationSeconds,this.config.master.releaseSeconds,1/c.notes.length*1.65,(i-1)*c.spreadCents));}
  playArrival(direction){
    const ctx=this.ensure();if(!ctx)return;const c=direction>0?this.config.arrivalUp:this.config.arrivalDown,t=ctx.currentTime+.02;
    this.tone(c.notes[0],t,c.firstNoteDurationSeconds,c.firstReleaseSeconds,c.firstVolumeScale);
    this.tone(c.notes[1],t+c.secondNoteStartSeconds,c.secondNoteDurationSeconds,c.secondReleaseSeconds,c.secondVolumeScale);
  }
}
