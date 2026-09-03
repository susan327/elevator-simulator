import * as THREE from 'three';

export class MaterialLibrary {
  constructor(){
    this.version=0;this.loader=new THREE.TextureLoader();this.materials=new Map();
    this.definitions={
      entranceStone:{url:new URL('../../assets/textures/limestone.jpg',import.meta.url).href,repeat:[4,3],roughness:.78,metalness:.02},
      conferenceCarpet:{url:new URL('../../assets/textures/conference-carpet.jpg',import.meta.url).href,repeat:[4,3],roughness:.96,metalness:0},
      designTerrazzo:{url:new URL('../../assets/textures/design-terrazzo.jpg',import.meta.url).href,repeat:[4,3],roughness:.84,metalness:.01},
      executiveOak:{url:new URL('../../assets/textures/executive-oak.jpg',import.meta.url).href,repeat:[3,3],roughness:.66,metalness:.01},
      cityBlueHour:{url:new URL('../../assets/textures/city-blue-hour.jpg',import.meta.url).href,repeat:[1,1],unlit:true}
      ,medicalVinyl:{url:new URL('../../assets/textures/medical-vinyl.webp',import.meta.url).href,repeat:[5,3],roughness:.88,metalness:0}
      ,officeCarpetBlue:{url:new URL('../../assets/textures/office-carpet-blue.webp',import.meta.url).href,repeat:[5,3],roughness:.98,metalness:0}
      ,hotelCarpetTaupe:{url:new URL('../../assets/textures/hotel-carpet-taupe.webp',import.meta.url).href,repeat:[5,3],roughness:.97,metalness:0}
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
