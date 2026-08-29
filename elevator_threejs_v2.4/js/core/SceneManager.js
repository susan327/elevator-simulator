class SceneManager {
  constructor(container){
    this.container=container;this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0x16191d);this.scene.fog=new THREE.Fog(0x16191d,24,115);
    this.renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.renderer.shadowMap.enabled=false;
    container.appendChild(this.renderer.domElement);this.addLights();this.resize();addEventListener('resize',()=>this.resize());
  }
  addLights(){
    this.scene.add(new THREE.HemisphereLight(0xffead0,0x30343a,1.65));
    const key=new THREE.DirectionalLight(0xfff1dc,1.35);key.position.set(8,20,12);this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xbfd7ef,.45);fill.position.set(-7,10,6);this.scene.add(fill);
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;this.renderer.setSize(w,h,false);if(this.onResize)this.onResize(w,h);}
  render(camera){this.renderer.render(this.scene,camera);}
}
