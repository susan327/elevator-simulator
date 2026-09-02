class SceneManager {
  constructor(container){
    this.container=container;this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0x16191d);this.scene.fog=new THREE.Fog(0x16191d,24,115);
    this.renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
    // 高DPI画面でも描画ピクセル数をCSS表示サイズまでに抑え、GPU負荷を軽減する。
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.renderer.shadowMap.enabled=false;
    this.needsRender=true;
    container.appendChild(this.renderer.domElement);this.addLights();this.resize();addEventListener('resize',()=>this.resize());
  }
  addLights(){
    this.scene.add(new THREE.HemisphereLight(0xffead0,0x30343a,1.65));
    const key=new THREE.DirectionalLight(0xfff1dc,1.35);key.position.set(8,20,12);this.scene.add(key);
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;this.renderer.setSize(w,h,false);if(this.onResize)this.onResize(w,h);this.needsRender=true;}
  render(camera){this.renderer.render(this.scene,camera);this.needsRender=false;}
}
