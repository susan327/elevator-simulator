import * as THREE from 'three';

export class ElevatorCar {
  constructor(scene,building,geometryConfig){
    this.scene=scene;this.building=building;this.config=geometryConfig;
    this.group=new THREE.Group();scene.add(this.group);
    this.group.position.y=building.floorY(1);this.build();
  }
  mat(color,props={}){return new THREE.MeshStandardMaterial({color,roughness:.44,metalness:.35,...props});}
  mesh(w,h,d,color,x,y,z,props={},parent=this.group){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.mat(color,props));
    m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;
  }
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
    this.mesh(sideFill,doorH,.10,0x3b3f44,-width/2+sideFill/2,doorH/2,0,metal,leaf);
    this.mesh(sideFill,doorH,.10,0x3b3f44, width/2-sideFill/2,doorH/2,0,metal,leaf);
    this.mesh(visibleWindowWidth,windowBottom,.10,0x3b3f44,0,windowBottom/2,0,metal,leaf);
    this.mesh(visibleWindowWidth,doorH-windowTop,.10,0x3b3f44,0,windowTop+(doorH-windowTop)/2,0,metal,leaf);
    this.mesh(visibleWindowWidth,.065,.10,0x3b3f44,0,windowBottom+.032,0,metal,leaf);
    this.mesh(visibleWindowWidth,.065,.10,0x3b3f44,0,windowTop-.032,0,metal,leaf);
    const glass=this.mesh(Math.max(.06,visibleWindowWidth-.025),Math.max(.12,windowTop-windowBottom-.095),.028,0xb8c5ca,0,(windowBottom+windowTop)/2,-.055,
      {transparent:true,opacity:.20,roughness:.08,metalness:.02,side:THREE.DoubleSide},leaf);
    glass.material=new THREE.MeshPhysicalMaterial({color:0xb8c5ca,transparent:true,opacity:.20,roughness:.08,metalness:.02,transmission:.10,side:THREE.DoubleSide});
    leaf.userData.closedX=side==='left'?-width/2:width/2;
    // 全開時は扉の中心を戸袋中心へ合わせ、外側へ突き抜けないようにする。
    leaf.userData.openX=side==='left'?-c.pocketCenterX:c.pocketCenterX;
    leaf.position.set(leaf.userData.closedX,0,1.27);this.group.add(leaf);return leaf;
  }
  makeControlPanel(w,h,d){
    const served=this.building.floorService?.servedNumbers||Array.from({length:this.building.floors},(_,i)=>i+1);
    this.interactiveObjects=[];this.carButtons=new Map();
    const count=served.length,cols=count<=12?2:count<=24?3:count<=40?4:5,rows=Math.ceil(count/cols);
    const panelW=Math.min(.58,Math.max(.36,cols*.105+.12)),availableH=Math.min(1.82,h-.34),stepY=Math.min(.145,(availableH-.38)/Math.max(1,rows-1));
    const buttonSize=Math.max(.042,Math.min(.070,(panelW-.10)/cols*.62,stepY*.52));
    const panel=new THREE.Group();panel.position.set(w/2-.085,1.16,.05);panel.rotation.y=-Math.PI/2;this.group.add(panel);
    this.mesh(panelW,availableH,.085,0x1b1f23,0,0,0,{metalness:.48,roughness:.26},panel);
    this.mesh(panelW*.55,.15,.025,0x0b0d10,0,availableH/2-.13,.055,{metalness:.25,roughness:.28},panel);
    served.slice().reverse().forEach((floor,index)=>{
      const row=Math.floor(index/cols),col=index%cols,x=(col-(cols-1)/2)*((panelW-.09)/cols),y=availableH/2-.30-row*stepY;
      const face=this.mesh(buttonSize,buttonSize,.028,0xd2d9dd,x,y,.060,{metalness:.72,roughness:.18,emissive:0x15222a,emissiveIntensity:.20},panel);
      face.userData.interaction={type:'carCall',floor,label:String(floor)};face.userData.baseEmissive=0x15222a;this.interactiveObjects.push(face);this.carButtons.set(floor,face);
    });
    const doorY=-availableH/2+.13;
    const open=this.mesh(panelW*.34,.07,.028,0x78c786,-panelW*.20,doorY,.060,{emissive:0x183c22,emissiveIntensity:.55},panel);open.userData.interaction={type:'doorOpen'};this.interactiveObjects.push(open);
    const close=this.mesh(panelW*.34,.07,.028,0xd6b16a,panelW*.20,doorY,.060,{emissive:0x4b3108,emissiveIntensity:.55},panel);close.userData.interaction={type:'doorClose'};this.interactiveObjects.push(close);
  }
  setCarCallLight(floor,on){const b=this.carButtons?.get(Number(floor));if(!b)return;b.material.emissive.setHex(on?0x116f91:b.userData.baseEmissive);b.material.emissiveIntensity=on?1.8:.20;}
  build(){
    const c=this.config,w=c.carWidth,h=c.carHeight,d=c.carDepth;
    this.mesh(w,.16,d,0x6d6257,0,.08,-.02,{roughness:.78,metalness:.06});
    this.mesh(.14,h,d,0xb9ad9e,-w/2+.07,h/2+.08,-.02,{roughness:.76,metalness:.07});
    this.mesh(.14,h,d,0xb9ad9e, w/2-.07,h/2+.08,-.02,{roughness:.76,metalness:.07});
    this.mesh(w,h,.14,0xd2c7b8,0,h/2+.08,-d/2+.07,{roughness:.84,metalness:.02});
    this.mesh(Math.max(.8,w-.55),.055,.07,0x9c8d7c,0,1.02,-d/2+.13,{metalness:.65,roughness:.25});
    this.mesh(Math.max(.65,w*.48),.045,Math.max(.42,d*.34),0xffe0b1,0,h-.05,-.15,{emissive:0x9a571d,emissiveIntensity:1.6,roughness:.35,metalness:.02});

    // かご前面の内壁。扉開口以外を完全に覆い、上段構造や台車を見せない。
    const frontZ=1.18, openingW=c.frameOuterWidth, openingH=c.frameOuterHeight;

    // v1.8.2: 既存の屋根は客室本体の奥行きまでしかなく、ドア前室の上が抜けていた。
    // 内装天井と外側屋根をドア前まで延長し、かご内から上部フレームを完全に遮蔽する。
    const roofBackZ=-d/2-.02;
    const roofFrontZ=frontZ+.22;
    const fullRoofDepth=roofFrontZ-roofBackZ;
    const fullRoofCenterZ=(roofFrontZ+roofBackZ)/2;
    this.mesh(w-.02,.12,fullRoofDepth,0xe7dfd3,0,h+.015,fullRoofCenterZ,{roughness:.86,metalness:.01});
    this.mesh(w+.08,.16,fullRoofDepth+.08,0x252a2f,0,h+.25,fullRoofCenterZ,{metalness:.48,roughness:.31});
    const frontSideW=Math.max(.08,(w-openingW)/2);
    this.mesh(frontSideW,h,.16,0xb9ad9e,-(openingW/2+frontSideW/2),h/2+.08,frontZ,{roughness:.76,metalness:.07});
    this.mesh(frontSideW,h,.16,0xb9ad9e, (openingW/2+frontSideW/2),h/2+.08,frontZ,{roughness:.76,metalness:.07});
    const headerH=Math.max(.10,h-openingH+.08);
    this.mesh(openingW,headerH,.16,0xb9ad9e,0,openingH+headerH/2,frontZ,{roughness:.76,metalness:.07});
    this.mesh(c.frameSide,openingH,.18,0x4b443d,-openingW/2+c.frameSide/2,openingH/2,frontZ+.02,{roughness:.48,metalness:.18});
    this.mesh(c.frameSide,openingH,.18,0x4b443d, openingW/2-c.frameSide/2,openingH/2,frontZ+.02,{roughness:.48,metalness:.18});
    this.mesh(openingW,c.frameTop,.18,0x4b443d,0,openingH-c.frameTop/2,frontZ+.02,{roughness:.48,metalness:.18});

    // かご内側の戸袋。開扉時に扉が壁内へ収納されて見える。
    const pocketDepth=.18,pocketZ=1.28;
    this.mesh(c.pocketWidth,h+.02,pocketDepth,0x2d3136,-(c.doorPanelTotalWidth/2+c.pocketWidth/2),h/2,pocketZ,{metalness:.62,roughness:.30});
    this.mesh(c.pocketWidth,h+.02,pocketDepth,0x2d3136, (c.doorPanelTotalWidth/2+c.pocketWidth/2),h/2,pocketZ,{metalness:.62,roughness:.30});
    this.mesh(c.doorPanelTotalWidth+.05,.13,pocketDepth,0x252a2f,0,h+.03,pocketZ,{metalness:.55,roughness:.28});

    this.leftDoor=this.makeDoorLeaf('left');this.rightDoor=this.makeDoorLeaf('right');
    this.makeControlPanel(w,h,d);
    this.mesh(w+.02,.14,d+.04,0x252a2f,0,-.10,-.02,{metalness:.48,roughness:.31});
    this.setDoorOpen(this.doorProgress||0);
  }
  rebuild(){const y=this.group.position.y;this.disposeObject(this.group);this.group.position.y=y;this.build();}
  setFloorPosition(floorPosition){this.group.position.y=this.building.floorY(floorPosition);}
  setDoorOpen(progress){
    this.doorProgress=THREE.MathUtils.clamp(progress,0,1);if(!this.leftDoor||!this.rightDoor)return;
    this.leftDoor.position.x=THREE.MathUtils.lerp(this.leftDoor.userData.closedX,this.leftDoor.userData.openX,this.doorProgress);
    this.rightDoor.position.x=THREE.MathUtils.lerp(this.rightDoor.userData.closedX,this.rightDoor.userData.openX,this.doorProgress);
  }
}
