class CameraController {
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
      this.camera.position.set(0,y,7.15);this.camera.lookAt(0,y,1.15);
    }else{
      const y=this.car.group.position.y+1.58;
      // 上下階を見えない位置から先読みし、階境界で壁が突然現れるのを防ぐ。
      this.building.setVisibleFloor(this.car.group.position.y/this.building.floorHeight+1,1);
      this.camera.position.set(0,y,-.62);this.camera.lookAt(0,y,4.25);
    }
  }
}
