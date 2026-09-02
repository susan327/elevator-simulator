export class SimulationClock {
  constructor(){ this.scale=1; this.last=performance.now(); }
  setScale(value){ this.scale=[1,2,4,8].includes(value)?value:1; }
  tick(now){ const real=Math.min(0.05,(now-this.last)/1000); this.last=now; return {real,sim:real*this.scale}; }
}
