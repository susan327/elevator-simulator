class ElevatorSoundConfig {
  constructor(){
    this.master={pitchCents:37,octave:5,volume:.5,waveform:'triangle',attackSeconds:.015,releaseSeconds:1.5};
    this.call={notes:['Eb','G','Bb'],durationSeconds:.6,spreadCents:0};
    this.arrivalUp={notes:['Eb','G'],firstNoteDurationSeconds:.6,secondNoteDurationSeconds:.7,firstReleaseSeconds:1.6,secondReleaseSeconds:2.5,secondNoteStartSeconds:.3,firstVolumeScale:1,secondVolumeScale:1};
    this.arrivalDown={notes:['G','Eb'],firstNoteDurationSeconds:.6,secondNoteDurationSeconds:.7,firstReleaseSeconds:1.6,secondReleaseSeconds:2.5,secondNoteStartSeconds:.3,firstVolumeScale:1,secondVolumeScale:1};
  }
}
