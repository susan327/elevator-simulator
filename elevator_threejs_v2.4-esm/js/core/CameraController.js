import * as THREE from 'three';

export class CameraController {
  constructor(sceneManager,building,car){
    this.sceneManager=sceneManager;this.building=building;this.car=car;this.mode='hall';this.floor=1;
    this.camera=new THREE.PerspectiveCamera(62,1,.05,180);
    sceneManager.onResize=(w,h)=>{this.camera.aspect=w/h;this.camera.updateProjectionMatrix();};
    sceneManager.resize();this.update();
  }
  setHall(floor){this.mode='hall';this.floor=floor;this.building.setVisibleFloor(floor);this.update();}
  setCabin(){this.mode='cabin';this.building.setVisibleFloor(this.car.group.position.y/this.building.floorHeight+1,1);this.update();}
  update(){
    if(this.mode==='hall'){
      const y=this.building.floorY(this.floor)+1.58;
      const phonePortrait=document.body.classList.contains('preview-mobile')||matchMedia('(max-width: 599px) and (orientation: portrait)').matches;
      const tabletPortrait=document.body.classList.contains('preview-tablet-portrait')||matchMedia('(min-width: 600px) and (max-width: 900px) and (orientation: portrait)').matches;
      const hallFov=phonePortrait?94:tabletPortrait?76:62,hallZ=phonePortrait?7.65:tabletPortrait?7.35:6.25;
      if(this.camera.fov!==hallFov){this.camera.fov=hallFov;this.camera.updateProjectionMatrix();}
      this.camera.position.set(0,y,hallZ);this.camera.lookAt(0,y,1.35);
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
