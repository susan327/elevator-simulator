class MaterialLibrary {
  constructor(){
    this.version=0;this.loader=new THREE.TextureLoader();this.materials=new Map();
    this.definitions={
      entranceStone:{url:'assets/textures/limestone.jpg',repeat:[4,3],roughness:.78,metalness:.02},
      conferenceCarpet:{url:'assets/textures/conference-carpet.jpg',repeat:[4,3],roughness:.96,metalness:0},
      designTerrazzo:{url:'assets/textures/design-terrazzo.jpg',repeat:[4,3],roughness:.84,metalness:.01},
      executiveOak:{url:'assets/textures/executive-oak.jpg',repeat:[3,3],roughness:.66,metalness:.01},
      cityBlueHour:{url:'assets/textures/city-blue-hour.jpg',repeat:[1,1],unlit:true}
    };
  }
  get(name){
    if(this.materials.has(name))return this.materials.get(name);
    const def=this.definitions[name];if(!def)return null;
    const texture=this.loader.load(def.url,()=>{this.version++;});texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    if(def.repeat[0]!==1||def.repeat[1]!==1){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(...def.repeat);}
    const material=def.unlit?new THREE.MeshBasicMaterial({map:texture}):new THREE.MeshStandardMaterial({map:texture,color:0xffffff,roughness:def.roughness,metalness:def.metalness});
    this.materials.set(name,material);return material;
  }
}
