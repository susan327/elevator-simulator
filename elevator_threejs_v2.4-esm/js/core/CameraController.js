import * as THREE from 'three';

export class CameraController {
  constructor(sceneManager,building,car){
    this.sceneManager=sceneManager;this.building=building;this.car=car;this.mode='hall';this.floor=1;this.hallFocus=null;
    this.camera=new THREE.PerspectiveCamera(62,1,.05,180);
    sceneManager.onResize=(w,h)=>{this.camera.aspect=w/h;this.camera.updateProjectionMatrix();};
    sceneManager.resize();this.update();
  }
  setHall(floor){this.mode='hall';this.floor=floor;this.hallFocus=null;this.building.setVisibleFloor(floor);this.update();}
  toggleHallFocus(id){if(this.mode!=='hall')return false;this.hallFocus=this.hallFocus===id?null:id;this.update();this.sceneManager.needsRender=true;return !!this.hallFocus;}
  setCabin(){this.mode='cabin';this.building.setVisibleFloor(this.car.group.position.y/this.building.floorHeight+1,1);this.update();}
  setWalk(walker){this.mode='walk';this.walker=walker;this.floor=walker.floor;this.building.setVisibleFloor(walker.floor);this.update();}
  update(){
    if(this.mode==='walk'){
      const w=this.walker,y=this.building.floorY(w.floor)+1.62,dir=new THREE.Vector3(Math.sin(w.yaw),Math.sin(w.pitch),-Math.cos(w.yaw)).normalize();
      if(this.camera.fov!==72){this.camera.fov=72;this.camera.updateProjectionMatrix();}
      this.camera.position.set(w.position.x,y,w.position.z);this.camera.lookAt(w.position.x+dir.x*4,y+dir.y*4,w.position.z+dir.z*4);return;
    }
    if(this.mode==='hall'){
      const y=this.building.floorY(this.floor)+1.58;
      const phonePortrait=document.body.classList.contains('preview-mobile')||matchMedia('(max-width: 599px) and (orientation: portrait)').matches;
      const tabletPortrait=document.body.classList.contains('preview-tablet-portrait')||matchMedia('(min-width: 600px) and (max-width: 900px) and (orientation: portrait)').matches;
      // 廊下奥の区画壁より手前に視点を置き、縦画面でも乗場扉を遮らない。
      const focused=this.hallFocus&&this.building.shaftIds.includes(this.hallFocus),shaftX=focused?this.building.getShaftCenter(this.hallFocus):0;
      const hallFov=focused?(phonePortrait?72:tabletPortrait?64:56):(phonePortrait?100:tabletPortrait?82:62),hallZ=focused?(phonePortrait?5.85:5.65):(phonePortrait?6.62:tabletPortrait?6.52:6.25);
      if(this.camera.fov!==hallFov){this.camera.fov=hallFov;this.camera.updateProjectionMatrix();}
      this.camera.position.set(shaftX,y+(focused?.10:0),hallZ);this.camera.lookAt(shaftX,y+(focused?.22:.10),1.35);
    }else{
      const y=this.car.group.position.y+1.58;
      const mobilePortrait=document.body.classList.contains('preview-mobile')||matchMedia('(max-width: 599px) and (orientation: portrait)').matches;
      const tabletPortrait=document.body.classList.contains('preview-tablet-portrait')||matchMedia('(min-width: 600px) and (max-width: 900px) and (orientation: portrait)').matches;
      const tabletLandscape=document.body.classList.contains('preview-tablet-landscape')||matchMedia('(min-width: 600px) and (max-width: 1100px) and (orientation: landscape)').matches;
      const cabinFov=mobilePortrait?94:tabletPortrait?74:tabletLandscape?82:78;
      const lookX=mobilePortrait?-.30:tabletPortrait?-.12:tabletLandscape?-.28:-.24;
      const lookY=mobilePortrait||tabletPortrait?y:y-.12;
      if(this.camera.fov!==cabinFov){this.camera.fov=cabinFov;this.camera.updateProjectionMatrix();}
      // 上下階を見えない位置から先読みし、階境界で壁が突然現れるのを防ぐ。
      this.building.setVisibleFloor(this.car.group.position.y/this.building.floorHeight+1,1);
      const shaftX=this.car.shaftX||0;this.camera.position.set(shaftX,y,-.62);this.camera.lookAt(shaftX+lookX,lookY,4.25);
    }
  }
}
