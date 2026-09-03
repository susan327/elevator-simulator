import * as THREE from 'three';
import { OfficeFloorCatalog } from './OfficeFloorCatalog.js';
import { FloorSceneBuilder } from './FloorSceneBuilder.js';
import { MaterialLibrary } from './MaterialLibrary.js';

export class BuildingBuilder {
  constructor(scene,{floors=20,floorHeight=3.6,geometryConfig=null,floorService=null}={}){this.scene=scene;this.floors=floors;this.floorHeight=floorHeight;this.geometryConfig=geometryConfig;this.floorService=floorService;this.shaftIds=['A','B'];this.elevatorPositions={A:NaN,B:NaN};this.materialLibrary=new MaterialLibrary();this.floorSceneBuilder=new FloorSceneBuilder(this);this.group=new THREE.Group();scene.add(this.group);this.hallDoors={A:[],B:[]};this.shaftBacks={A:[],B:[]};this.hallButtons={A:[],B:[]};this.hallIndicators={A:[],B:[]};this.floorGroups=[];this.interactiveObjects=[];this.build();this.setVisibleFloor(1);}
  getShaftCenter(id){return this.shaftCenters?.[id]??0;}
  floorY(floor){const exact=Number(floor);if(Number.isInteger(exact)&&this.floorService){const data=this.floorService.getFloor(exact);if(data)return data.elevation;}return (exact-1)*this.floorHeight;}
  mat(color,props={}){return new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.04,...props});}
  box(w,h,d,color,x,y,z,props={},parent=this.group){const {materialName,...materialProps}=props;const material=materialName?this.materialLibrary.get(materialName):this.mat(color,materialProps);const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.receiveShadow=false;mesh.castShadow=false;parent.add(mesh);return mesh;}
  shaftCurtain(w,h,x,y,z,parent=this.group){const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:0x000000,side:THREE.FrontSide,toneMapped:false}),make=()=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,1),material);mesh.renderOrder=1;group.add(mesh);return mesh;};group.position.set(x,y-h/2,z);group.userData={height:h,bottom:make(),top:make()};parent.add(group);return group;}
  label(text,w,h,parent,x=0,y=0,z=.061,color='#182027'){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,256);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 150px sans-serif';ctx.fillText(String(text),128,132);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  sign(text,w,h,parent,x,y,z,background='#17212a',foreground='#e8f2fa'){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,768,192);ctx.strokeStyle='#71869a';ctx.lineWidth=8;ctx.strokeRect(7,7,754,178);ctx.fillStyle=foreground;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 58px sans-serif';ctx.fillText(text,384,100);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  makeTravelIndicator(parent,x,y,z,w=1.30,h=.26){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));mesh.position.set(x,y,z);mesh.userData={canvas,texture,text:''};parent.add(mesh);this.drawTravelIndicator(mesh,1,0);return mesh;}
  drawTravelIndicator(mesh,floor,direction){const text=`${direction>0?'▲':direction<0?'▼':'■'}  ${Math.max(1,Math.min(this.floors,Math.round(floor)))}F`;if(mesh.userData.text===text)return;mesh.userData.text=text;const ctx=mesh.userData.canvas.getContext('2d');ctx.clearRect(0,0,512,128);ctx.fillStyle='#ffd468';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 72px sans-serif';ctx.fillText(text,256,66);mesh.userData.texture.needsUpdate=true;}
  setTravelIndicator(floor,direction,id='A'){for(const indicator of this.hallIndicators[id]||[])if(indicator)this.drawTravelIndicator(indicator,floor,direction);}
  dispose(){this.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});this.scene.remove(this.group);}
  makeDoorLeaf(parent,side,z=0){
    const leaf=new THREE.Group(),c=this.geometryConfig,width=c.doorLeafWidth,doorHeight=c.doorHeight;
    const windowTop=c.windowTop,windowBottom=Math.max(.26,windowTop-c.windowHeight);
    const visibleWindowWidth=Math.min(c.windowWidth,width-.08),sideFill=Math.max(.025,(width-visibleWindowWidth)/2),metal={metalness:.35,roughness:.20,emissive:0x454a4d,emissiveIntensity:.18};
    this.box(sideFill,doorHeight,.11,0xd5dadd,-width/2+sideFill/2,doorHeight/2,0,metal,leaf);
    this.box(sideFill,doorHeight,.11,0xd5dadd,width/2-sideFill/2,doorHeight/2,0,metal,leaf);
    this.box(visibleWindowWidth,windowBottom,.11,0xd5dadd,0,windowBottom/2,0,metal,leaf);
    this.box(visibleWindowWidth,doorHeight-windowTop,.11,0xd5dadd,0,windowTop+(doorHeight-windowTop)/2,0,metal,leaf);
    this.box(visibleWindowWidth,.065,.11,0xd5dadd,0,windowBottom+.032,0,metal,leaf);
    this.box(visibleWindowWidth,.065,.11,0xd5dadd,0,windowTop-.032,0,metal,leaf);
    this.box(.012,doorHeight-.025,.008,0x111417,side==='left'?width/2-.006:-width/2+.006,doorHeight/2,.061,{metalness:.18,roughness:.82},leaf);
    this.box(Math.max(.06,visibleWindowWidth-.025),Math.max(.12,windowTop-windowBottom-.095),.028,0x020609,0,(windowBottom+windowTop)/2,-.055,{transparent:true,opacity:.04,roughness:.08,metalness:.02,side:THREE.DoubleSide},leaf);
    leaf.userData.closedX=side==='left'?-width/2:width/2;
    // 扉中心を戸袋中心へ合わせ、外枠の外へ突き抜けない。
    leaf.userData.openX=side==='left'?-c.pocketCenterX:c.pocketCenterX;
    leaf.position.set(leaf.userData.closedX,0,z);parent.add(leaf);return leaf;
  }
  floorProfile(f){
    const signature=OfficeFloorCatalog.get(f);if(signature)return signature;
    const names=['','MAIN ENTRANCE','VISITOR RECEPTION','SALES','CUSTOMER SUCCESS','HUMAN RESOURCES','CONFERENCE CENTER','FINANCE','LEGAL','GENERAL AFFAIRS','TRAINING CENTER','SKY LOBBY','ENGINEERING','PRODUCT DESIGN','QUALITY LAB','IT OPERATIONS','SECURITY CENTER','DATA & AI','RESEARCH & DEVELOPMENT','MARKETING','PROJECT HUB','SKY LOBBY','GLOBAL BUSINESS','CORPORATE STRATEGY','CONSULTING','INNOVATION LAB','EXECUTIVE SUPPORT','BOARD OFFICE','EXECUTIVE OFFICE','PRESIDENT OFFICE','OBSERVATION LOUNGE'];
    let type='office',zone=f<=10?'LOW-RISE OFFICE':f<=20?'MID-RISE OFFICE':'HIGH-RISE OFFICE';
    if(f===1)type='lobby';else if(f===11||f===21)type='lounge';else if(f===6||f===10||f===16||f===20||f===25)type='meeting';else if(f===30)type='observation';else if(f>=27)type='executive';
    const palette=f===1?{wall:0xe1d5c4,floor:0xc9bca9,ceiling:0xf1eadf,trim:0x806f5c,accent:0x8b7257}:f===11?{wall:0xcbd8d8,floor:0xaebbbb,ceiling:0xe6eeee,trim:0x66797d,accent:0x58747c}:f===21?{wall:0xc7d0dc,floor:0xa7b0bd,ceiling:0xe3e8ef,trim:0x606c80,accent:0x536785}:f===30?{wall:0xb8cad5,floor:0x8e9fab,ceiling:0xdce8ed,trim:0x536978,accent:0x49677d}:f>=27?{wall:0xd2c8d2,floor:0xaaa0aa,ceiling:0xe9e2e9,trim:0x736979,accent:0x655a70}:f>=22?{wall:0xcbd3d6,floor:0xadb6ba,ceiling:0xe6ebed,trim:0x65747b,accent:0x536b78}:f>=12?{wall:0xd2d4cf,floor:0xb5b7b1,ceiling:0xe9ebe6,trim:0x707874,accent:0x65716f}:{wall:0xd9d2c8,floor:0xbdb4a8,ceiling:0xeee9e1,trim:0x7b7063,accent:0x6d7b80};
    return {type,zone,name:names[f]||`${f}F OFFICE`,...palette};
  }
  buildFloorScenery(lobby,f,lobbyH){
    const backZ=9.95,{type,zone,name,accent}=this.floorProfile(f);
    const profile=this.floorProfile(f);if(this.floorSceneBuilder.build(lobby,f,lobbyH,profile))return;

    this.box(10.8,2.55,.10,accent,0,1.42,backZ-.18,{roughness:.88},lobby);
    this.box(3.1,.38,.08,0x12171d,0,2.75,backZ-.10,{roughness:.75},lobby);
    this.sign(`${f}F  ${name}`,3.0,.34,lobby,0,2.75,backZ-.045,'#111820','#f0d994');
    this.box(.12,2.55,5.2,accent,-5.45,1.42,7.35,{roughness:.86},lobby);this.box(.12,2.55,5.2,accent,5.45,1.42,7.35,{roughness:.86},lobby);
    this.box(1.05,2.18,.10,0x30383f,-4.15,1.09,9.70,{metalness:.18,roughness:.48},lobby);this.box(1.05,2.18,.10,0x30383f,4.15,1.09,9.70,{metalness:.18,roughness:.48},lobby);
    this.box(.18,.04,4.8,0xf4e2bd,-3.15,lobbyH-.25,7.15,{emissive:0x8a5c25,emissiveIntensity:1.15},lobby);this.box(.18,.04,4.8,0xf4e2bd,3.15,lobbyH-.25,7.15,{emissive:0x8a5c25,emissiveIntensity:1.15},lobby);

    if(type==='lobby'){
      this.box(3.8,.85,.90,0x71533d,0,.43,7.8,{roughness:.72},lobby);
      this.box(1.0,1.35,.55,0x304d2e,-4.0,.68,7.7,{roughness:.85},lobby);
      this.box(1.0,1.35,.55,0x304d2e,4.0,.68,7.7,{roughness:.85},lobby);
      this.box(2.2,.08,.70,0xc9dce2,-3.5,1.48,9.54,{transparent:true,opacity:.28,roughness:.08},lobby);this.box(2.2,.08,.70,0xc9dce2,3.5,1.48,9.54,{transparent:true,opacity:.28,roughness:.08},lobby);
    }else if(type==='meeting'){
      this.box(4.6,.12,1.45,0x76644f,0,.78,7.8,{roughness:.72},lobby);
      for(let x=-1.8;x<=1.8;x+=1.2){this.box(.52,.70,.52,0x39434d,x,.35,6.85,{roughness:.7},lobby);this.box(.52,.70,.52,0x39434d,x,.35,8.75,{roughness:.7},lobby);}
      this.box(2.5,1.20,.06,0x172534,0,1.55,9.61,{emissive:0x183a58,emissiveIntensity:.42,roughness:.18},lobby);this.box(4.8,2.15,.045,0xa7c5ce,0,1.38,9.50,{transparent:true,opacity:.18,roughness:.08},lobby);
    }else if(type==='lounge'){
      this.box(2.7,.72,.95,0x596a50,-2.3,.36,7.9,{roughness:.82},lobby);
      this.box(2.7,.72,.95,0x596a50,2.3,.36,7.9,{roughness:.82},lobby);
      this.box(1.4,.25,.75,0x755d43,0,.25,7.5,{roughness:.75},lobby);
      for(let x=-4.2;x<=4.2;x+=1.4)this.box(1.16,2.05,.045,0x75a8be,x,1.42,9.54,{transparent:true,opacity:.32,roughness:.06},lobby);
    }else if(type==='cafe'){
      for(let x=-3;x<=3;x+=2){this.box(.78,.10,.78,0x76533c,x,.75,7.8,{roughness:.68},lobby);this.box(.12,.72,.12,0x3a342e,x,.36,7.8,{metalness:.2,roughness:.5},lobby);}
      this.box(4.6,.95,.72,0x5e4534,0,.48,9.0,{roughness:.72},lobby);
    }else if(type==='executive'){
      this.box(3.2,.82,1.05,0x4d4252,2.4,.42,7.9,{roughness:.78},lobby);
      this.box(2.0,.62,.90,0x544735,-2.5,.31,8.0,{roughness:.72},lobby);
      this.box(4.6,1.55,.08,0x4b382c,0,1.35,9.55,{roughness:.58},lobby);this.box(1.2,.72,.08,0xd7bd86,0,1.48,9.49,{metalness:.12,roughness:.4},lobby);
    }else if(type==='observation'){
      for(let x=-4.5;x<=4.5;x+=1.5)this.box(1.22,2.2,.05,0x7fb3ca,x,1.35,backZ-.12,{transparent:true,opacity:.34,roughness:.08,metalness:.02},lobby);
      this.box(4.0,.55,.85,0x40566a,0,.28,7.9,{roughness:.78},lobby);
    }else{
      const deskColor=[0x59656e,0x67625d,0x53636a][f%3],partitionColor=[0xa9b5ba,0xb9b0a5,0x9fadb0][f%3];
      for(let x=-4;x<=4;x+=2){this.box(1.35,.72,.72,deskColor,x,.36,7.8,{roughness:.82},lobby);this.box(.08,1.15,.75,partitionColor,x,.92,8.2,{roughness:.88},lobby);}
      if(f%2===0)this.box(2.3,.08,.62,accent,2.8,1.18,9.25,{roughness:.72},lobby);else this.box(2.3,.08,.62,accent,-2.8,1.18,9.25,{roughness:.72},lobby);
      this.box(2.0,1.65,.045,0xa9c5cc,-3.15,1.42,9.52,{transparent:true,opacity:.20,roughness:.07},lobby);this.box(2.0,1.65,.045,0xa9c5cc,3.15,1.42,9.52,{transparent:true,opacity:.20,roughness:.07},lobby);
      for(let x=-4;x<=4;x+=2)this.box(.48,.30,.035,0x18242e,x,1.05,7.39,{emissive:0x17364a,emissiveIntensity:.35,roughness:.25},lobby);
    }
    lobby.userData.floorVisualType=type;lobby.userData.floorZone=zone;
  }
  build(){
    const total=this.floorHeight*this.floors,c=this.geometryConfig,shaftW=Math.max(3.0,c.carWidth+.95),shaftD=Math.max(2.6,c.carDepth+.85),half=shaftW/2,spacing=shaftW+.42;
    this.shaftWidth=shaftW;this.shaftCenters={A:-spacing/2,B:spacing/2};
    for(const id of this.shaftIds){const x=this.shaftCenters[id];this.box(shaftW,total,.35,0x090c10,x,total/2-this.floorHeight/2,-shaftD/2,{roughness:1});this.box(.28,total,shaftD,0x171c22,x-half,total/2-this.floorHeight/2,0,{roughness:.95});this.box(.28,total,shaftD,0x171c22,x+half,total/2-this.floorHeight/2,0,{roughness:.95});this.box(.12,total,.12,0x747d84,x-c.carWidth/2-.20,total/2-this.floorHeight/2,-.45,{metalness:.82,roughness:.18});this.box(.12,total,.12,0x747d84,x+c.carWidth/2+.20,total/2-this.floorHeight/2,-.45,{metalness:.82,roughness:.18});}
    for(let f=1;f<=this.floors;f++)this.buildFloor(f);
  }
  buildFloor(f){
    const y=this.floorY(f),c=this.geometryConfig,lobby=new THREE.Group(),profile=this.floorProfile(f);lobby.position.y=y;this.group.add(lobby);this.floorGroups[f]=lobby;const {wall,trim}=profile,openingW=c.frameOuterWidth,openingH=c.frameOuterHeight,lobbyH=this.floorHeight,doorXs=this.shaftIds.map(id=>this.shaftCenters[id]);
    const floorMaterial={1:'entranceStone',6:'conferenceCarpet',14:'designTerrazzo',27:'executiveOak'}[f];this.box(16.5,.22,8.8,profile.floor,0,-.11,5.85,{roughness:.92,materialName:floorMaterial},lobby);this.box(16.5,.22,8.8,profile.ceiling,0,lobbyH-.11,5.85,{roughness:.96},lobby);this.box(16.5,lobbyH,.24,wall,0,lobbyH/2,10.2,{roughness:.94},lobby);
    const facadeHalf=8.25,edges=[-facadeHalf,doorXs[0]-openingW/2,doorXs[0]+openingW/2,doorXs[1]-openingW/2,doorXs[1]+openingW/2,facadeHalf];for(const [a,b] of [[edges[0],edges[1]],[edges[2],edges[3]],[edges[4],edges[5]]])this.box(b-a,lobbyH,.18,wall,(a+b)/2,lobbyH/2,1.48,{roughness:.92},lobby);
    for(const doorX of doorXs){this.box(openingW,Math.max(.15,lobbyH-openingH),.18,wall,doorX,openingH+(lobbyH-openingH)/2,1.48,{roughness:.92},lobby);this.box(c.frameSide,openingH,.22,trim,doorX-openingW/2+c.frameSide/2,openingH/2,1.59,{roughness:.55,metalness:.14},lobby);this.box(c.frameSide,openingH,.22,trim,doorX+openingW/2-c.frameSide/2,openingH/2,1.59,{roughness:.55,metalness:.14},lobby);this.box(openingW,c.frameTop,.22,trim,doorX,openingH-c.frameTop/2,1.59,{roughness:.55,metalness:.14},lobby);this.box(openingW-.08,.10,.28,0x454442,doorX,-.05,1.54,{roughness:.75,metalness:.12},lobby);}
    for(let gx=-5.4;gx<=5.4;gx+=1.35)this.box(.025,.018,8.2,0x8d857b,gx,.015,5.9,{roughness:1},lobby);for(let gz=2.0;gz<=9.6;gz+=1.25)this.box(12.8,.018,.025,0x8d857b,0,.017,gz,{roughness:1},lobby);
    this.buildFloorScenery(lobby,f,lobbyH);
    this.box(.58,1.05,.58,0x493327,-3.75,.52,6.7,{roughness:.9},lobby);this.box(.85,.64,.85,0x3c6038,-3.75,1.23,6.7,{roughness:.82},lobby);
    for(let i=-2;i<=2;i++)this.box(.42,.045,.42,0xf4e1c5,i*2.25,lobbyH-.23,5.1,{emissive:0x7a4b18,emissiveIntensity:1.35},lobby);
    // 乗場扉は壁内へ収納し、正面から戸袋の柱が見えない構成にする。
    for(const id of this.shaftIds){const doorX=this.shaftCenters[id],doorGroup=new THREE.Group();doorGroup.position.set(doorX,0,c.hallDoorZ);lobby.add(doorGroup);const left=this.makeDoorLeaf(doorGroup,'left'),right=this.makeDoorLeaf(doorGroup,'right');this.hallDoors[id][f]={group:doorGroup,left,right};this.shaftBacks[id][f]=this.shaftCurtain(c.doorPanelTotalWidth,c.doorHeight,doorX,c.doorHeight/2,c.cabinDoorZ-.12,lobby);this.setHallDoorOpen(f,0,id);this.box(1.25,.40,.10,0x0d0f12,doorX,openingH+.45,1.62,{metalness:.45,roughness:.23},lobby);this.hallIndicators[id][f]=this.makeTravelIndicator(lobby,doorX,openingH+.45,1.676,1.06,.26);this.sign(`${id}号機`,.72,.22,lobby,doorX,openingH+.76,1.676,'#182027','#e9d48d');}
    for(const id of this.shaftIds)this.buildHallPanel(lobby,f,this.shaftCenters[id]+openingW/2+.28,id);
  }

  makeInteractiveButton(parent,{x,y,z,label,type,floor,direction,size=.15}){
    const group=new THREE.Group();group.position.set(x,y,z);parent.add(group);
    this.box(size*1.5,size*1.5,.035,0x222930,0,0,0,{metalness:.55,roughness:.22},group);
    const face=this.box(size,size,.045,0xc8d0d5,0,0,.035,{metalness:.72,roughness:.20,emissive:0x17242c,emissiveIntensity:.22},group);
    face.userData.labelMesh=this.label(label,size*.72,size*.72,group);
    face.userData.interaction={type,floor,direction,label};face.userData.buttonGroup=group;face.userData.baseEmissive=0x17242c;this.interactiveObjects.push(face);return face;
  }
  buildHallPanel(lobby,f,panelX,elevatorId){
    if(this.floorService&&!this.floorService.isServed(f)){this.hallButtons[elevatorId][f]=null;return;}
    const dirs=[];if(f<this.floors)dirs.push('up');if(f>1)dirs.push('down');
    const panelH=dirs.length===2?.82:.50;this.box(.34,panelH,.12,0x15181c,panelX,1.25,1.60,{metalness:.55,roughness:.24},lobby);
    const data={};dirs.forEach((dir,i)=>{const y=dirs.length===2?1.43-i*.34:1.25;data[dir]=this.makeInteractiveButton(lobby,{x:panelX,y,z:1.69,label:dir==='up'?'▲':'▼',type:'hallCall',floor:f,direction:dir,size:.14});data[dir].userData.interaction.elevatorId=elevatorId;});
    this.hallButtons[elevatorId][f]=data;
  }
  setHallCallLight(floor,direction,on,arriving=false,elevatorId=null){for(const id of elevatorId?[elevatorId]:this.shaftIds){const b=this.hallButtons[id]?.[floor]?.[direction];if(!b)continue;b.material.emissive.setHex(on?(arriving?0xffb000:0x8a3c00):b.userData.baseEmissive);b.material.emissiveIntensity=on?(arriving?2.5:1.7):.22;}}
  setVisibleFloor(floor,radius=0){
    const active=Math.max(1,Math.min(this.floors,Math.round(floor))),range=Math.max(0,Math.round(radius)),key=`${active}:${range}`;
    if(this.visibleFloorRange===key)return;this.visibleFloorRange=key;
    for(let f=1;f<=this.floors;f++)if(this.floorGroups[f])this.floorGroups[f].visible=Math.abs(f-active)<=range;
  }
  setCurtainPart(mesh,height,centerY){mesh.visible=height>.001;if(!mesh.visible)return;mesh.scale.y=height;mesh.position.y=centerY;}
  updateShaftAppearance(id,floor){const d=this.hallDoors[id]?.[floor],back=this.shaftBacks[id]?.[floor];if(!d||!back)return;const h=back.userData.height,opening=(d.progress||0)>.005;if(opening){back.visible=false;return;}back.visible=true;const position=this.elevatorPositions[id];if(!Number.isFinite(position)){this.setCurtainPart(back.userData.bottom,0,0);this.setCurtainPart(back.userData.top,h,h/2);return;}const offsetY=this.floorY(position)-this.floorY(floor),carBottom=offsetY-.72,carTop=offsetY+this.geometryConfig.carHeight+.31,visibleBottom=THREE.MathUtils.clamp(carBottom,0,h),visibleTop=THREE.MathUtils.clamp(carTop,0,h);this.setCurtainPart(back.userData.bottom,visibleBottom,visibleBottom/2);this.setCurtainPart(back.userData.top,h-visibleTop,(h+visibleTop)/2);}
  setHallDoorOpen(floor,progress,id='A'){const d=this.hallDoors[id]?.[floor];if(!d)return;const p=THREE.MathUtils.clamp(progress,0,1);d.progress=p;d.left.position.x=THREE.MathUtils.lerp(d.left.userData.closedX,d.left.userData.openX,p);d.right.position.x=THREE.MathUtils.lerp(d.right.userData.closedX,d.right.userData.openX,p);this.updateShaftAppearance(id,floor);}
  setElevatorPosition(id,floorPosition){this.elevatorPositions[id]=floorPosition;for(let f=1;f<=this.floors;f++)this.updateShaftAppearance(id,f);}
}
