export class PassengerSimulationConfig {
  constructor(){this.enabled=false;this.spawnInterval=12;this.maxWaitingPerFloor=3;this.demandPattern='auto';}
  setInterval(value){this.spawnInterval=Math.max(4,Math.min(60,Number(value)||12));}
  setMaxWaiting(value){this.maxWaitingPerFloor=Math.max(1,Math.min(8,Number(value)||3));}
  setPattern(value){if(['auto','morning','midday','evening'].includes(value))this.demandPattern=value;}
  currentPattern(){if(this.demandPattern!=='auto')return this.demandPattern;const hour=new Date().getHours();return hour<10?'morning':hour>=17?'evening':'midday';}
}
