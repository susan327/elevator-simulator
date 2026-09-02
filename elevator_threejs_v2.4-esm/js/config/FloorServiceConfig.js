export class FloorServiceConfig {
  constructor(floorCount=20,floorHeight=3.6){
    this.floorCount=floorCount;this.floorHeight=floorHeight;this.preset='all';this.customExpression='';this.rebuild();
  }
  rebuild(){
    const oldServed=new Set((this.floors||[]).filter(x=>x.served).map(x=>x.number));
    this.floors=[];let elevation=0;
    for(let n=1;n<=this.floorCount;n++){
      this.floors.push({number:n,label:`${n}F`,elevation,served:oldServed.size?oldServed.has(n):true,type:this.typeFor(n)});
      elevation+=this.floorHeight;
    }
    this.ensureTerminals();
  }
  updateBuilding(floorCount,floorHeight){this.floorCount=floorCount;this.floorHeight=floorHeight;this.rebuild();this.applyPreset(this.preset,true);}
  typeFor(n){if(n===1)return'lobby';if(n===this.floorCount)return'observation';if(n>=Math.max(2,this.floorCount-2))return'executive';if(n%10===6)return'cafe';if(n%10===1)return'lounge';if(n%5===0)return'meeting';return'office';}
  ensureTerminals(){if(!this.floors.length)return;this.floors[0].served=true;this.floors[this.floors.length-1].served=true;}
  applyPreset(key,silent=false){
    this.lastError='';
    this.preset=key;
    if(key==='custom'&&this.customExpression)return this.applyExpression(this.customExpression,silent);
    const top=this.floorCount;
    for(const f of this.floors){
      if(key==='all')f.served=true;
      else if(key==='upper10')f.served=f.number===1||f.number>=10;
      else if(key==='shuttle10')f.served=f.number===1||f.number===top||f.number%10===0;
      else if(key==='highZone')f.served=f.number===1||f.number>=Math.max(10,Math.ceil(top*.5));
    }
    this.ensureTerminals();return true;
  }
  parseExpressionDetailed(text){
    const source=String(text||'').trim(),set=new Set(),invalid=[];
    if(!source)return {floors:[],invalid:['入力が空です']};
    source.split(',').map(x=>x.trim()).filter(Boolean).forEach(token=>{
      const range=token.match(/^(\d+)\s*[-~]\s*(\d+)$/);
      if(range){let a=Number(range[1]),b=Number(range[2]);if(a<1||b<1||a>this.floorCount||b>this.floorCount){invalid.push(token);return;}if(a>b)[a,b]=[b,a];for(let n=a;n<=b;n++)set.add(n);}
      else{const n=Number(token);if(Number.isInteger(n)&&n>=1&&n<=this.floorCount)set.add(n);else invalid.push(token);}
    });
    if(!invalid.length){set.add(1);set.add(this.floorCount);}
    return {floors:[...set].sort((a,b)=>a-b),invalid};
  }
  parseExpression(text){return this.parseExpressionDetailed(text).floors;}
  applyExpression(text,silent=false){
    const parsed=this.parseExpressionDetailed(text),served=parsed.floors;
    if(parsed.invalid.length){this.lastError=`解釈できない指定: ${parsed.invalid.join(', ')}`;return false;}
    if(served.length<2){this.lastError='停止階を指定してください';return false;}
    this.lastError='';
    this.customExpression=text;this.preset='custom';const set=new Set(served);for(const f of this.floors)f.served=set.has(f.number);this.ensureTerminals();return true;
  }
  isServed(number){return !!this.floors[number-1]?.served;}
  getFloor(number){return this.floors[number-1]||null;}
  get servedFloors(){return this.floors.filter(f=>f.served);}
  get servedNumbers(){return this.servedFloors.map(f=>f.number);}
  get expression(){return this.servedNumbers.join(',');}
  nearestServed(number){return this.servedNumbers.reduce((best,n)=>Math.abs(n-number)<Math.abs(best-number)?n:best,this.servedNumbers[0]||1);}
}
