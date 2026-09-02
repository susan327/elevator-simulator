import * as THREE from 'three';

export class BuildingBuilder {
  constructor(scene,{floors=20,floorHeight=3.6,geometryConfig=null,floorService=null}={}){this.scene=scene;this.floors=floors;this.floorHeight=floorHeight;this.geometryConfig=geometryConfig;this.floorService=floorService;this.group=new THREE.Group();scene.add(this.group);this.hallDoors=[];this.hallButtons=[];this.floorGroups=[];this.interactiveObjects=[];this.build();this.setVisibleFloor(1);}
  floorY(floor){const exact=Number(floor);if(Number.isInteger(exact)&&this.floorService){const data=this.floorService.getFloor(exact);if(data)return data.elevation;}return (exact-1)*this.floorHeight;}
  mat(color,props={}){return new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.04,...props});}
  box(w,h,d,color,x,y,z,props={},parent=this.group){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.mat(color,props));mesh.position.set(x,y,z);mesh.receiveShadow=false;mesh.castShadow=false;parent.add(mesh);return mesh;}
  dispose(){this.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});this.scene.remove(this.group);}
  makeDoorLeaf(parent,side,z=0){
    const leaf=new THREE.Group(),c=this.geometryConfig,width=c.doorLeafWidth,doorHeight=c.doorHeight;
    const windowTop=c.windowTop,windowBottom=Math.max(.26,windowTop-c.windowHeight);
    const visibleWindowWidth=Math.min(c.windowWidth,width-.08),sideFill=Math.max(.025,(width-visibleWindowWidth)/2),metal={metalness:.72,roughness:.25};
    this.box(sideFill,doorHeight,.11,0x33373c,-width/2+sideFill/2,doorHeight/2,0,metal,leaf);
    this.box(sideFill,doorHeight,.11,0x33373c,width/2-sideFill/2,doorHeight/2,0,metal,leaf);
    this.box(visibleWindowWidth,windowBottom,.11,0x33373c,0,windowBottom/2,0,metal,leaf);
    this.box(visibleWindowWidth,doorHeight-windowTop,.11,0x33373c,0,windowTop+(doorHeight-windowTop)/2,0,metal,leaf);
    this.box(visibleWindowWidth,.065,.11,0x33373c,0,windowBottom+.032,0,metal,leaf);
    this.box(visibleWindowWidth,.065,.11,0x33373c,0,windowTop-.032,0,metal,leaf);
    this.box(Math.max(.06,visibleWindowWidth-.025),Math.max(.12,windowTop-windowBottom-.095),.028,0xb7c3c7,0,(windowBottom+windowTop)/2,-.055,{transparent:true,opacity:.21,roughness:.08,metalness:.02,side:THREE.DoubleSide},leaf);
    leaf.userData.closedX=side==='left'?-width/2:width/2;
    // 扉中心を戸袋中心へ合わせ、外枠の外へ突き抜けない。
    leaf.userData.openX=side==='left'?-c.pocketCenterX:c.pocketCenterX;
    leaf.position.set(leaf.userData.closedX,0,z);parent.add(leaf);return leaf;
  }
  buildFloorScenery(lobby,f,lobbyH){
    const backZ=9.95;
    let type='office';
    const accent=0x53636b;
    if(f===1)type='lobby';
    else if(f===this.floors)type='observation';
    else if(f>=Math.max(2,this.floors-2))type='executive';
    else if(f%10===6)type='cafe';
    else if(f%10===1)type='lounge';
    else if(f%5===0)type='meeting';

    this.box(10.8,2.55,.10,accent,0,1.42,backZ-.18,{roughness:.88},lobby);
    this.box(3.1,.38,.08,0x12171d,0,2.75,backZ-.10,{roughness:.75},lobby);

    if(type==='lobby'){
      this.box(3.8,.85,.90,0x71533d,0,.43,7.8,{roughness:.72},lobby);
      this.box(1.0,1.35,.55,0x304d2e,-4.0,.68,7.7,{roughness:.85},lobby);
      this.box(1.0,1.35,.55,0x304d2e,4.0,.68,7.7,{roughness:.85},lobby);
    }else if(type==='meeting'){
      this.box(4.6,.12,1.45,0x76644f,0,.78,7.8,{roughness:.72},lobby);
      for(let x=-1.8;x<=1.8;x+=1.2){this.box(.52,.70,.52,0x39434d,x,.35,6.85,{roughness:.7},lobby);this.box(.52,.70,.52,0x39434d,x,.35,8.75,{roughness:.7},lobby);}
    }else if(type==='lounge'){
      this.box(2.7,.72,.95,0x596a50,-2.3,.36,7.9,{roughness:.82},lobby);
      this.box(2.7,.72,.95,0x596a50,2.3,.36,7.9,{roughness:.82},lobby);
      this.box(1.4,.25,.75,0x755d43,0,.25,7.5,{roughness:.75},lobby);
    }else if(type==='cafe'){
      for(let x=-3;x<=3;x+=2){this.box(.78,.10,.78,0x76533c,x,.75,7.8,{roughness:.68},lobby);this.box(.12,.72,.12,0x3a342e,x,.36,7.8,{metalness:.2,roughness:.5},lobby);}
      this.box(4.6,.95,.72,0x5e4534,0,.48,9.0,{roughness:.72},lobby);
    }else if(type==='executive'){
      this.box(3.2,.82,1.05,0x4d4252,2.4,.42,7.9,{roughness:.78},lobby);
      this.box(2.0,.62,.90,0x544735,-2.5,.31,8.0,{roughness:.72},lobby);
    }else if(type==='observation'){
      for(let x=-4.5;x<=4.5;x+=1.5)this.box(1.22,2.2,.05,0x7fb3ca,x,1.35,backZ-.12,{transparent:true,opacity:.34,roughness:.08,metalness:.02},lobby);
      this.box(4.0,.55,.85,0x40566a,0,.28,7.9,{roughness:.78},lobby);
    }else{
      for(let x=-4;x<=4;x+=2){this.box(1.35,.72,.72,0x5e6871,x,.36,7.8,{roughness:.82},lobby);this.box(.08,1.15,.75,0xaeb8bd,x,.92,8.2,{roughness:.88},lobby);}
    }
    lobby.userData.floorVisualType=type;
  }
  build(){
    const total=this.floorHeight*this.floors,c=this.geometryConfig,shaftW=Math.max(3.0,c.carWidth+.95),shaftD=Math.max(2.6,c.carDepth+.85),half=shaftW/2;
    this.shaftWidth=shaftW;this.box(shaftW,total,.35,0x090c10,0,total/2-this.floorHeight/2,-shaftD/2,{roughness:1});this.box(.34,total,shaftD,0x171c22,-half,total/2-this.floorHeight/2,0,{roughness:.95});this.box(.34,total,shaftD,0x171c22,half,total/2-this.floorHeight/2,0,{roughness:.95});
    this.box(.12,total,.12,0x747d84,-c.carWidth/2-.20,total/2-this.floorHeight/2,-.45,{metalness:.82,roughness:.18});this.box(.12,total,.12,0x747d84,c.carWidth/2+.20,total/2-this.floorHeight/2,-.45,{metalness:.82,roughness:.18});
    for(let f=1;f<=this.floors;f++)this.buildFloor(f);
  }
  buildFloor(f){
    const y=this.floorY(f),c=this.geometryConfig,lobby=new THREE.Group();lobby.position.y=y;this.group.add(lobby);this.floorGroups[f]=lobby;const wall=0xd5cabc,trim=0x75695c,openingW=c.frameOuterWidth,openingH=c.frameOuterHeight,lobbyH=this.floorHeight;
    this.box(13.5,.22,8.8,0xb9afa2,0,-.11,5.85,{roughness:.92},lobby);this.box(13.5,.22,8.8,0xe8e0d5,0,lobbyH-.11,5.85,{roughness:.96},lobby);this.box(13.5,lobbyH,.24,wall,0,lobbyH/2,10.2,{roughness:.94},lobby);
    const sideW=(13.5-openingW)/2;this.box(sideW,lobbyH,.32,wall,-(openingW/2+sideW/2),lobbyH/2,1.55,{roughness:.92},lobby);this.box(sideW,lobbyH,.32,wall,(openingW/2+sideW/2),lobbyH/2,1.55,{roughness:.92},lobby);this.box(openingW,Math.max(.15,lobbyH-openingH),.32,wall,0,openingH+(lobbyH-openingH)/2,1.55,{roughness:.92},lobby);
    this.box(c.frameSide,openingH,.55,trim,-openingW/2+c.frameSide/2,openingH/2,1.73,{roughness:.55,metalness:.14},lobby);this.box(c.frameSide,openingH,.55,trim,openingW/2-c.frameSide/2,openingH/2,1.73,{roughness:.55,metalness:.14},lobby);this.box(openingW,c.frameTop,.55,trim,0,openingH-c.frameTop/2,1.73,{roughness:.55,metalness:.14},lobby);this.box(openingW-.08,.10,.65,0x454442,0,.03,1.67,{roughness:.75,metalness:.12},lobby);
    for(let gx=-5.4;gx<=5.4;gx+=1.35)this.box(.025,.018,8.2,0x8d857b,gx,.015,5.9,{roughness:1},lobby);for(let gz=2.0;gz<=9.6;gz+=1.25)this.box(12.8,.018,.025,0x8d857b,0,.017,gz,{roughness:1},lobby);
    this.buildFloorScenery(lobby,f,lobbyH);
    this.box(.58,1.05,.58,0x493327,-3.75,.52,6.7,{roughness:.9},lobby);this.box(.85,.64,.85,0x3c6038,-3.75,1.23,6.7,{roughness:.82},lobby);
    for(let i=-2;i<=2;i++)this.box(.42,.045,.42,0xf4e1c5,i*2.25,lobbyH-.23,5.1,{emissive:0x7a4b18,emissiveIntensity:1.35},lobby);
    // 乗場側の戸袋。開いた扉を左右の壁内へ収納する。
    const pocketX=c.pocketCenterX;
    this.box(c.pocketWidth,openingH-.04,.24,0x51483f,-pocketX,(openingH-.04)/2,1.96,{metalness:.28,roughness:.50},lobby);
    this.box(c.pocketWidth,openingH-.04,.24,0x51483f, pocketX,(openingH-.04)/2,1.96,{metalness:.28,roughness:.50},lobby);
    const doorGroup=new THREE.Group();doorGroup.position.set(0,0,1.88);lobby.add(doorGroup);
    const left=this.makeDoorLeaf(doorGroup,'left'),right=this.makeDoorLeaf(doorGroup,'right');
    this.hallDoors[f]={group:doorGroup,left,right};this.setHallDoorOpen(f,0);
    const panelX=openingW/2+.62;this.buildHallPanel(lobby,f,panelX);this.box(1.50,.40,.13,0x0d0f12,0,openingH+.45,1.83,{metalness:.45,roughness:.23},lobby);
  }

  makeInteractiveButton(parent,{x,y,z,label,type,floor,direction,size=.15}){
    const group=new THREE.Group();group.position.set(x,y,z);parent.add(group);
    this.box(size*1.5,size*1.5,.035,0x222930,0,0,0,{metalness:.55,roughness:.22},group);
    const face=this.box(size,size,.045,0xc8d0d5,0,0,.035,{metalness:.72,roughness:.20,emissive:0x17242c,emissiveIntensity:.22},group);
    face.userData.interaction={type,floor,direction,label};face.userData.buttonGroup=group;face.userData.baseEmissive=0x17242c;this.interactiveObjects.push(face);return face;
  }
  buildHallPanel(lobby,f,panelX){
    if(this.floorService&&!this.floorService.isServed(f)){this.hallButtons[f]=null;return;}
    const dirs=[];if(f<this.floors)dirs.push('up');if(f>1)dirs.push('down');
    const panelH=dirs.length===2?.82:.50;this.box(.34,panelH,.16,0x15181c,panelX,1.25,1.83,{metalness:.55,roughness:.24},lobby);
    const data={};dirs.forEach((dir,i)=>{const y=dirs.length===2?1.43-i*.34:1.25;data[dir]=this.makeInteractiveButton(lobby,{x:panelX,y,z:1.93,label:dir==='up'?'▲':'▼',type:'hallCall',floor:f,direction:dir,size:.14});});
    this.hallButtons[f]=data;
  }
  setHallCallLight(floor,direction,on){const b=this.hallButtons[floor]?.[direction];if(!b)return;b.material.emissive.setHex(on?0x8a3c00:b.userData.baseEmissive);b.material.emissiveIntensity=on?1.7:.22;}
  setVisibleFloor(floor,radius=0){
    const active=Math.max(1,Math.min(this.floors,Math.round(floor))),range=Math.max(0,Math.round(radius)),key=`${active}:${range}`;
    if(this.visibleFloorRange===key)return;this.visibleFloorRange=key;
    for(let f=1;f<=this.floors;f++)if(this.floorGroups[f])this.floorGroups[f].visible=Math.abs(f-active)<=range;
  }
  setHallDoorOpen(floor,progress){const d=this.hallDoors[floor];if(!d)return;const p=THREE.MathUtils.clamp(progress,0,1);d.left.position.x=THREE.MathUtils.lerp(d.left.userData.closedX,d.left.userData.openX,p);d.right.position.x=THREE.MathUtils.lerp(d.right.userData.closedX,d.right.userData.openX,p);}
}
