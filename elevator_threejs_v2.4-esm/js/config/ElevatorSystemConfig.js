import { FloorServiceConfig } from './FloorServiceConfig.js';
import { ControlPanelLayout } from '../elevator/ControlPanelLayout.js';
import { BuildingTemplateCatalog } from './BuildingTemplateCatalog.js';

export class ElevatorSystemConfig {
  constructor(){
    this.cabinPresets={
      small:{label:'小型 9人',capacity:9,load:600,carWidth:2.25,carDepth:1.35,carHeight:2.30,doorWidth:.80,doorHeight:2.00,windowWidth:.20,windowHeight:1.40,windowTopMargin:.16},
      medium:{label:'中型 15人',capacity:15,load:1000,carWidth:2.40,carDepth:1.50,carHeight:2.30,doorWidth:.90,doorHeight:2.10,windowWidth:.32,windowHeight:1.47,windowTopMargin:.20},
      large:{label:'大型 20人',capacity:20,load:1350,carWidth:2.70,carDepth:1.70,carHeight:2.40,doorWidth:1.10,doorHeight:2.10,windowWidth:.28,windowHeight:1.47,windowTopMargin:.15}
    };
    this.motionPresets={
      low:{label:'低速',maxSpeed:1.00,acceleration:.40,deceleration:.35,accelJerk:.28,decelJerk:.22,landingSpeed:.040,landingDistance:.20,maxLandingDeceleration:.22,maxLandingJerk:.26,minLandingTime:1.15},
      medium:{label:'中速',maxSpeed:1.75,acceleration:.52,deceleration:.45,accelJerk:.36,decelJerk:.28,landingSpeed:.035,landingDistance:.25,maxLandingDeceleration:.26,maxLandingJerk:.31,minLandingTime:1.20},
      high:{label:'高速',maxSpeed:3.00,acceleration:.65,deceleration:.55,accelJerk:.45,decelJerk:.35,landingSpeed:.030,landingDistance:.30,maxLandingDeceleration:.30,maxLandingJerk:.36,minLandingTime:1.25},
      ultra:{label:'超高速',maxSpeed:5.00,acceleration:.78,deceleration:.65,accelJerk:.55,decelJerk:.42,landingSpeed:.025,landingDistance:.38,maxLandingDeceleration:.34,maxLandingJerk:.42,minLandingTime:1.30}
    };
    this.defaults={floors:30,floorHeight:3.60,cabinPreset:'medium',motionPreset:'high',buildingPreset:'office30'};
    this.reset();
  }
  reset(){this.floors=this.defaults.floors;this.floorHeight=this.defaults.floorHeight;this.buildingPreset=this.defaults.buildingPreset;this.applyCabinPreset(this.defaults.cabinPreset);this.applyMotionPreset(this.defaults.motionPreset);this.setupFloorServices();this.applyZonedServiceDefaults();}
  setupFloorServices(){if(!this.floorService)this.floorService=new FloorServiceConfig(this.floors,this.floorHeight);else this.floorService.updateBuilding(this.floors,this.floorHeight);this.floorService.applyPreset('all');if(!this.unitFloorServices)this.unitFloorServices={A:new FloorServiceConfig(this.floors,this.floorHeight,{requireTerminals:false}),B:new FloorServiceConfig(this.floors,this.floorHeight,{requireTerminals:false})};else for(const service of Object.values(this.unitFloorServices))service.updateBuilding(this.floors,this.floorHeight);}
  applyZonedServiceDefaults(){const transfer=Math.min(15,this.floors),a=`1-${transfer}`,b=this.floors>transfer?`1,2,${transfer}-${this.floors}`:`1-${this.floors}`;this.applyUnitServiceExpression('A',a);this.applyUnitServiceExpression('B',b);}
  applyBuildingPreset(key){const preset=BuildingTemplateCatalog.definitions[key];if(!preset)return false;this.floors=preset.floors;this.floorHeight=preset.floorHeight;this.buildingPreset=key;this.applyCabinPreset(key==='ryokan'?'small':key==='hospital'?'large':'medium');this.applyMotionPreset(this.floors<=8?'low':this.floors<=20?'medium':'high');this.setupFloorServices();for(const id of ['A','B'])this.applyUnitServiceExpression(id,preset.services[id]);return true;}
  applyCabinPreset(key){const p=this.cabinPresets[key];if(!p)return false;this.cabinPreset=key;Object.assign(this,p);return true;}
  applyMotionPreset(key){const p=this.motionPresets[key];if(!p)return false;this.motionPreset=key;Object.assign(this,p);this.jerk=this.decelJerk;return true;}
  set(key,value){
    const rules={
      floors:[2,60,1],floorHeight:[2.8,5.0,.1],carWidth:[1.50,3.00,.05],carDepth:[1.20,2.40,.05],carHeight:[2.10,2.80,.05],
      doorWidth:[.70,1.40,.05],doorHeight:[1.90,2.40,.05],windowWidth:[.12,.50,.02],windowHeight:[.40,1.75,.05],windowTopMargin:[.08,.40,.02],
      maxSpeed:[.5,8,.25],acceleration:[.35,1.30,.05],deceleration:[.35,1.40,.05],accelJerk:[.20,1.80,.05],decelJerk:[.20,1.80,.05],landingSpeed:[.015,.10,.005],landingDistance:[.15,.80,.05]
    };
    const r=rules[key];if(!r)return false;let n=Number(value);n=Math.max(r[0],Math.min(r[1],n));n=Math.round(n/r[2])*r[2];this[key]=Number(n.toFixed(3));
    if(key==='floors'){this.buildingPreset='custom';this.setupFloorServices();this.applyZonedServiceDefaults();}
    else if(key==='floorHeight'){this.buildingPreset='custom';this.setupFloorServices();}
    if(['carWidth','carDepth','carHeight','doorWidth','doorHeight','windowWidth','windowHeight','windowTopMargin'].includes(key))this.cabinPreset='custom';
    if(['maxSpeed','acceleration','deceleration','accelJerk','decelJerk','landingSpeed','landingDistance'].includes(key))this.motionPreset='custom';
    this.jerk=this.decelJerk;return true;
  }
  adjust(key,direction){
    const steps={floors:1,floorHeight:.1,carWidth:.05,carDepth:.05,carHeight:.05,doorWidth:.05,doorHeight:.05,windowWidth:.02,windowHeight:.05,windowTopMargin:.02,maxSpeed:.25,acceleration:.05,deceleration:.05,accelJerk:.05,decelJerk:.05,landingSpeed:.005,landingDistance:.05};
    return this.set(key,this[key]+Math.sign(direction)*(steps[key]||0));
  }
  validate(){
    const errors=[],warnings=[];
    if(this.doorWidth>this.carWidth-.20)errors.push('ドア幅は、かご内幅より0.20m以上小さくしてください。');
    if(this.doorHeight>this.carHeight-.05)errors.push('ドア高さは、かご内高さより0.05m以上低くしてください。');
    if(this.windowWidth>this.doorWidth/2-.08)errors.push('窓幅が片側ドア幅に収まりません。');
    if(this.windowHeight+this.windowTopMargin>this.doorHeight-.18)errors.push('窓高さと上端余白の組み合わせがドア内に収まりません。');
    const doorPanelWidth=this.doorWidth+Math.max(.12,this.doorWidth*.14),frameSide=Math.max(.13,Math.min(.19,this.doorWidth*.16)),panelWidth=ControlPanelLayout.forCount(Math.max(...['A','B'].map(id=>this.servedFloorsFor(id).length))).panelWidth;
    if(this.carWidth<doorPanelWidth+frameSide*2+(panelWidth+.10)*2)errors.push('かご幅が、中央ドアの左右同幅と右側操作盤スペースを両立する必要幅に足りません。');
    if(this.floors<=8&&this.maxSpeed>=5)warnings.push('低層建物では超高速設定の効果がほとんど出ません。');
    if(this.floors>=30&&this.maxSpeed<=1)warnings.push('高層建物に低速設定のため、所要時間が長くなります。');
    return {ok:errors.length===0,errors,warnings};
  }
  applyServicePreset(key){return this.floorService.applyPreset(key);}
  applyServiceExpression(text){return this.floorService.applyExpression(text);}
  applyUnitServiceExpression(id,text){const service=this.unitFloorServices?.[id];if(!service)return false;return service.applyExpression(text);}
  restore(saved){
    if(!saved||typeof saved!=='object')return false;
    if(this.cabinPresets[saved.cabinPreset])this.applyCabinPreset(saved.cabinPreset);if(this.motionPresets[saved.motionPreset])this.applyMotionPreset(saved.motionPreset);this.buildingPreset=saved.buildingPreset||'custom';
    const keys=['floors','floorHeight','carWidth','carDepth','carHeight','doorWidth','doorHeight','windowWidth','windowHeight','windowTopMargin','maxSpeed','acceleration','deceleration','accelJerk','decelJerk','landingSpeed','landingDistance'];
    for(const key of keys)if(Number.isFinite(Number(saved[key])))this.set(key,Number(saved[key]));
    if(Array.isArray(saved.servedFloors))this.applyServiceExpression(saved.servedFloors.join(','));if(saved.unitServedFloors)for(const id of ['A','B'])if(Array.isArray(saved.unitServedFloors[id]))this.applyUnitServiceExpression(id,saved.unitServedFloors[id].join(','));
    this.buildingPreset=BuildingTemplateCatalog.definitions[saved.buildingPreset]?saved.buildingPreset:'custom';this.cabinPreset=this.cabinPresets[saved.cabinPreset]?saved.cabinPreset:'custom';this.motionPreset=this.motionPresets[saved.motionPreset]?saved.motionPreset:'custom';return this.validate().ok;
  }
  isServed(floor,id=null){if(id)return !!this.unitFloorServices?.[id]?.isServed(Number(floor));return ['A','B'].some(unitId=>this.unitFloorServices?.[unitId]?.isServed(Number(floor)));}
  servedFloorsFor(id){return this.unitFloorServices?.[id]?.servedNumbers||[];}
  hasDistinctServiceZones(){return this.servedFloorsFor('A').join(',')!==this.servedFloorsFor('B').join(',');}
  get servedFloors(){return this.floorService.servedNumbers;}
  snapshot(){return JSON.parse(JSON.stringify({floors:this.floors,floorHeight:this.floorHeight,buildingPreset:this.buildingPreset,cabinPreset:this.cabinPreset,motionPreset:this.motionPreset,capacity:this.capacity,load:this.load,carWidth:this.carWidth,carDepth:this.carDepth,carHeight:this.carHeight,doorWidth:this.doorWidth,doorHeight:this.doorHeight,windowWidth:this.windowWidth,windowHeight:this.windowHeight,windowTopMargin:this.windowTopMargin,maxSpeed:this.maxSpeed,acceleration:this.acceleration,deceleration:this.deceleration,accelJerk:this.accelJerk,decelJerk:this.decelJerk,landingSpeed:this.landingSpeed,landingDistance:this.landingDistance,maxLandingDeceleration:this.maxLandingDeceleration,maxLandingJerk:this.maxLandingJerk,minLandingTime:this.minLandingTime,servicePreset:this.floorService.preset,servedFloors:this.floorService.servedNumbers,unitServedFloors:Object.fromEntries(['A','B'].map(id=>[id,this.servedFloorsFor(id)]))}));}
}
