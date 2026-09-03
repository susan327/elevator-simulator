import * as THREE from 'three';

import { ControlPanelLayout } from './ControlPanelLayout.js';

export class ElevatorCar {
  constructor(scene,building,geometryConfig,{id='A',shaftX=0}={}){
    this.scene=scene;this.building=building;this.config=geometryConfig;this.id=id;this.shaftX=shaftX;
    this.group=new THREE.Group();this.group.position.x=shaftX;this.group.userData.elevatorId=id;scene.add(this.group);
    this.group.position.y=building.floorY(1);this.build();
  }
  mat(color,props={}){return new THREE.MeshStandardMaterial({color,roughness:.44,metalness:.35,...props});}
  mesh(w,h,d,color,x,y,z,props={},parent=this.group){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.mat(color,props));
    m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;
  }
  presencePanel(w,h,x,y,z,color){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,side:THREE.FrontSide,toneMapped:false}));mesh.position.set(x,y,z);this.group.add(mesh);return mesh;}
  label(text,w,h,parent,x,y,z,color='#f4f7f8',fontScale=.62){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${Math.round(canvas.height*fontScale)}px sans-serif`;ctx.fillText(String(text),canvas.width/2,canvas.height/2);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;
    const label=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));label.position.set(x,y,z);parent.add(label);return label;
  }
  makeTravelIndicator(parent,x,y,z,w,h){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));mesh.position.set(x,y,z);mesh.rotation.y=Math.PI;mesh.userData={canvas,texture,text:''};parent.add(mesh);this.travelIndicator=mesh;this.setTravelIndicator(1,0);return mesh;}
  setTravelIndicator(floor,direction){const mesh=this.travelIndicator;if(!mesh)return;const text=`${direction>0?'▲':direction<0?'▼':'■'}  ${Math.max(1,Math.min(this.building.floors,Math.round(floor)))}F`;if(mesh.userData.text===text)return;mesh.userData.text=text;const ctx=mesh.userData.canvas.getContext('2d');ctx.clearRect(0,0,512,128);ctx.fillStyle='#ffd468';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 72px sans-serif';ctx.fillText(text,256,66);mesh.userData.texture.needsUpdate=true;}
  disposeObject(root){
    root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});
    while(root.children.length)root.remove(root.children[0]);
  }
  makeDoorLeaf(side){
    const c=this.config,leaf=new THREE.Group(),metal={metalness:.74,roughness:.22};
    const width=c.doorLeafWidth,rail=Math.min(.12,width*.16),doorH=c.doorHeight;
    const windowTop=c.windowTop,windowBottom=Math.max(.26,windowTop-c.windowHeight);
    const visibleWindowWidth=Math.min(c.windowWidth,width-rail*2-.035);
    const sideFill=Math.max(.025,(width-visibleWindowWidth)/2);
    this.mesh(sideFill,doorH,.10,0x162b43,-width/2+sideFill/2,doorH/2,0,metal,leaf);
    this.mesh(sideFill,doorH,.10,0x162b43, width/2-sideFill/2,doorH/2,0,metal,leaf);
    this.mesh(visibleWindowWidth,windowBottom,.10,0x162b43,0,windowBottom/2,0,metal,leaf);
    this.mesh(visibleWindowWidth,doorH-windowTop,.10,0x162b43,0,windowTop+(doorH-windowTop)/2,0,metal,leaf);
    this.mesh(visibleWindowWidth,.065,.10,0x162b43,0,windowBottom+.032,0,metal,leaf);
    this.mesh(visibleWindowWidth,.065,.10,0x162b43,0,windowTop-.032,0,metal,leaf);
    this.mesh(.012,doorH-.025,.008,0x070b10,side==='left'?width/2-.006:-width/2+.006,doorH/2,-.055,{metalness:.14,roughness:.86},leaf);
    this.mesh(Math.max(.06,visibleWindowWidth-.025),Math.max(.12,windowTop-windowBottom-.095),.028,0xb8c5ca,0,(windowBottom+windowTop)/2,-.055,
      {transparent:true,opacity:.20,roughness:.08,metalness:.02,side:THREE.DoubleSide},leaf);
    leaf.userData.closedX=c.doorCenterX+(side==='left'?-width/2:width/2);
    // 全開時は扉の中心を戸袋中心へ合わせ、外側へ突き抜けないようにする。
    leaf.userData.openX=c.doorCenterX+(side==='left'?-c.pocketCenterX:c.pocketCenterX);
    leaf.position.set(leaf.userData.closedX,0,c.cabinDoorZ);this.group.add(leaf);return leaf;
  }
  makeControlPanel(w,h,d){
    const c=this.config,served=this.building.floorService?.servedNumbers||Array.from({length:this.building.floors},(_,i)=>i+1);
    this.interactiveObjects=[];this.carButtons=new Map();
    const layout=ControlPanelLayout.forCount(served.length),cols=layout.columns,rows=layout.rows;
    const panelW=layout.panelWidth,availableH=Math.min(h-.64,layout.panelHeight),gridSpan=Math.max(0,availableH-.59),stepY=rows>1?gridSpan/(rows-1):0,cellW=(panelW-.06)/cols;
    const buttonSize=Math.max(.040,Math.min(.070,cellW*.66,rows>1?stepY*.62:.070));
    // かご内からドアに向かって右側（Three.js座標では-X側）へ配置する。
    const panelLeftEdge=-w/2+.18,panelX=panelLeftEdge+panelW/2;
    const panelCenterY=h/2,panel=new THREE.Group();panel.position.set(panelX,panelCenterY,1.030);panel.rotation.y=Math.PI;this.group.add(panel);
    this.mesh(panelW,availableH,.085,0x1b1f23,0,0,0,{metalness:.48,roughness:.26},panel);
    this.mesh(panelW*.55,.15,.025,0x0b0d10,0,availableH/2-.13,.055,{metalness:.25,roughness:.28},panel);
    served.slice().reverse().forEach((floor,index)=>{
      const row=Math.floor(index/cols),col=index%cols,x=(col-(cols-1)/2)*cellW,y=availableH/2-.29-row*stepY;
      const face=this.mesh(buttonSize,buttonSize,.028,0xd2d9dd,x,y,.075,{metalness:.72,roughness:.18,emissive:0x15222a,emissiveIntensity:.20},panel);
      face.userData.labelMesh=this.label(floor,buttonSize*.94,buttonSize*.82,panel,x,y,.092,'#090f13',.92);
      face.userData.interaction={type:'carCall',floor,label:String(floor)};face.userData.baseEmissive=0x15222a;this.interactiveObjects.push(face);this.carButtons.set(floor,face);
    });
    const doorY=-availableH/2+.11;
    const open=this.mesh(panelW*.34,.07,.028,0x78c786,-panelW*.20,doorY,.075,{emissive:0x183c22,emissiveIntensity:.55},panel);open.userData.interaction={type:'doorOpen'};this.interactiveObjects.push(open);
    const close=this.mesh(panelW*.34,.07,.028,0xd6b16a,panelW*.20,doorY,.075,{emissive:0x4b3108,emissiveIntensity:.55},panel);close.userData.interaction={type:'doorClose'};this.interactiveObjects.push(close);
    open.userData.labelMesh=this.label('◀ 開 ▶',panelW*.30,.046,panel,-panelW*.20,doorY,.092,'#092414',.56);
    close.userData.labelMesh=this.label('▶ 閉 ◀',panelW*.30,.046,panel,panelW*.20,doorY,.092,'#2a1b04',.56);
  }
  setCarCallLight(floor,on){const b=this.carButtons?.get(Number(floor));if(!b)return;b.material.emissive.setHex(on?0x116f91:b.userData.baseEmissive);b.material.emissiveIntensity=on?1.8:.20;}
  build(){
    const c=this.config,w=c.carWidth,h=c.carHeight,d=c.carDepth,frontZ=c.cabinDoorZ-.09,floorBackZ=-d/2-.02,floorFrontZ=c.cabinDoorZ+.04,fullFloorDepth=floorFrontZ-floorBackZ,fullFloorCenterZ=(floorFrontZ+floorBackZ)/2;
    this.mesh(w,.16,fullFloorDepth,0x766d63,0,-.08,fullFloorCenterZ,{roughness:.78,metalness:.06});
    this.mesh(.14,h,fullFloorDepth,0xb9ad9e,-w/2+.07,h/2,fullFloorCenterZ,{roughness:.76,metalness:.07});
    this.mesh(.14,h,fullFloorDepth,0xb9ad9e, w/2-.07,h/2,fullFloorCenterZ,{roughness:.76,metalness:.07});
    this.mesh(w,h,.14,0xd2c7b8,0,h/2,-d/2+.07,{roughness:.84,metalness:.02});
    // 乗場窓から見える暖色の内装面。無彩色の昇降路と、移動するかごを判別しやすくする。
    this.presencePanel(Math.max(.72,w-.32),h-.24,0,h/2+.06,-d/2+.145,0x968a77);
    this.presencePanel(.026,h-.40,-c.doorLeafWidth/2,h/2+.05,-d/2+.149,0xd6b36f);
    this.presencePanel(.026,h-.40,c.doorLeafWidth/2,h/2+.05,-d/2+.149,0xd6b36f);
    this.mesh(Math.max(.8,w-.55),.055,.07,0x9c8d7c,0,1.02,-d/2+.13,{metalness:.65,roughness:.25});
    this.mesh(Math.max(.65,w*.48),.045,Math.max(.42,d*.34),0xffe0b1,0,h-.05,-.15,{emissive:0x9a571d,emissiveIntensity:1.15,roughness:.35,metalness:.02});
    const cabinLight=new THREE.PointLight(0xffead2,.55,4.2,1.75);cabinLight.position.set(0,h-.58,-.10);cabinLight.castShadow=false;this.group.add(cabinLight);

    // かご前面の内壁。扉開口以外を完全に覆い、上段構造や台車を見せない。
    const openingW=c.frameOuterWidth, openingH=c.frameOuterHeight,doorX=c.doorCenterX;

    // かご下部：戸口下エプロンと支持フレーム。乗場窓から通過するかごの下端を判別できる。
    this.mesh(c.doorPanelTotalWidth+.10,.48,.10,0x687178,doorX,-.38,c.cabinDoorZ-.10,{metalness:.58,roughness:.34});
    this.mesh(Math.max(.82,w-.34),.13,.30,0x4b535a,0,-.65,.86,{metalness:.66,roughness:.30});
    this.mesh(c.doorPanelTotalWidth-.04,.045,.025,0x9ba3a8,doorX,-.57,c.cabinDoorZ-.042,{metalness:.62,roughness:.24});

    // v1.8.2: 既存の屋根は客室本体の奥行きまでしかなく、ドア前室の上が抜けていた。
    // 内装天井と外側屋根をドア前まで延長し、かご内から上部フレームを完全に遮蔽する。
    const roofBackZ=-d/2-.02;
    const roofFrontZ=c.cabinDoorZ+.04;
    const fullRoofDepth=roofFrontZ-roofBackZ;
    const fullRoofCenterZ=(roofFrontZ+roofBackZ)/2;
    this.mesh(w-.02,.12,fullRoofDepth,0xe7dfd3,0,h+.015,fullRoofCenterZ,{roughness:.86,metalness:.01});
    this.mesh(.018,.014,fullRoofDepth-.10,0xaaa092,-w*.25,h-.052,fullRoofCenterZ,{roughness:.9,metalness:.02});
    this.mesh(.018,.014,fullRoofDepth-.10,0xaaa092,w*.25,h-.052,fullRoofCenterZ,{roughness:.9,metalness:.02});
    this.mesh(w-.10,.014,.018,0xaaa092,0,h-.052,fullRoofCenterZ,{roughness:.9,metalness:.02});
    this.mesh(w+.08,.16,fullRoofDepth+.08,0x687178,0,h+.25,fullRoofCenterZ,{metalness:.48,roughness:.31});
    const leftSideW=Math.max(.08,doorX-openingW/2+w/2),rightSideW=Math.max(.08,w/2-(doorX+openingW/2));
    this.mesh(leftSideW,h,.16,0xb9ad9e,-w/2+leftSideW/2,h/2+.08,frontZ,{roughness:.76,metalness:.07});
    this.mesh(rightSideW,h,.16,0xb9ad9e,w/2-rightSideW/2,h/2+.08,frontZ,{roughness:.76,metalness:.07});
    const headerH=Math.max(.10,h-openingH+.08);
    this.mesh(openingW,headerH,.16,0xb9ad9e,doorX,openingH+headerH/2,frontZ,{roughness:.76,metalness:.07});
    const indicatorW=Math.min(.86,openingW*.72),indicatorY=Math.min(h-.13,openingH+.13);this.mesh(indicatorW,.20,.04,0x0d0f12,doorX,indicatorY,frontZ-.105,{metalness:.46,roughness:.22});this.makeTravelIndicator(this.group,doorX,indicatorY,frontZ-.128,indicatorW*.86,.14);
    this.mesh(c.frameSide,openingH,.18,0x4b443d,doorX-openingW/2+c.frameSide/2,openingH/2,frontZ+.02,{roughness:.48,metalness:.18});
    this.mesh(c.frameSide,openingH,.18,0x4b443d,doorX+openingW/2-c.frameSide/2,openingH/2,frontZ+.02,{roughness:.48,metalness:.18});
    this.mesh(openingW,c.frameTop,.18,0x4b443d,doorX,openingH-c.frameTop/2,frontZ+.02,{roughness:.48,metalness:.18});

    // かご内側の戸袋。開扉時に扉が壁内へ収納されて見える。
    const pocketDepth=.18,pocketZ=c.cabinDoorZ-.04;
    this.mesh(c.pocketWidth,h+.02,pocketDepth,0x2d3136,doorX-(c.doorPanelTotalWidth/2+c.pocketWidth/2),h/2,pocketZ,{metalness:.62,roughness:.30});
    this.mesh(c.pocketWidth,h+.02,pocketDepth,0x2d3136,doorX+(c.doorPanelTotalWidth/2+c.pocketWidth/2),h/2,pocketZ,{metalness:.62,roughness:.30});
    this.mesh(c.doorPanelTotalWidth+.05,.13,pocketDepth,0x252a2f,doorX,h+.03,pocketZ,{metalness:.55,roughness:.28});

    this.leftDoor=this.makeDoorLeaf('left');this.rightDoor=this.makeDoorLeaf('right');
    this.makeControlPanel(w,h,d);
    this.mesh(w+.02,.14,fullFloorDepth+.04,0x596168,0,-.10,fullFloorCenterZ,{metalness:.48,roughness:.31});
    this.setDoorOpen(this.doorProgress||0);
  }
  rebuild(){const y=this.group.position.y;this.disposeObject(this.group);this.group.position.y=y;this.build();}
  setFloorPosition(floorPosition){this.group.position.y=this.building.floorY(floorPosition);this.building.setElevatorPosition?.(this.id,floorPosition);}
  setDoorOpen(progress){
    this.doorProgress=THREE.MathUtils.clamp(progress,0,1);if(!this.leftDoor||!this.rightDoor)return;
    this.leftDoor.position.x=THREE.MathUtils.lerp(this.leftDoor.userData.closedX,this.leftDoor.userData.openX,this.doorProgress);
    this.rightDoor.position.x=THREE.MathUtils.lerp(this.rightDoor.userData.closedX,this.rightDoor.userData.openX,this.doorProgress);
  }
}
