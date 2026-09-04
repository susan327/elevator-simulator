export class PwaManager {
  constructor({serviceWorkerUrl}){this.serviceWorkerUrl=serviceWorkerUrl;this.installEvent=null;this.reloading=false;this.bindInstallPrompt();this.register();}
  isStandalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
  isMobileOrTablet(){return matchMedia('(max-width: 1100px), (pointer: coarse)').matches;}
  async register(){
    if(!('serviceWorker'in navigator))return;
    const hadController=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||this.reloading)return;this.reloading=true;location.reload();});
    try{const registration=await navigator.serviceWorker.register(this.serviceWorkerUrl,{updateViaCache:'none'});await registration.update();}catch(error){console.warn('PWA更新確認に失敗しました',error);}
  }
  bindInstallPrompt(){
    addEventListener('beforeinstallprompt',event=>{event.preventDefault();this.installEvent=event;this.maybeShowInstallGuide();});
    addEventListener('appinstalled',()=>{this.installEvent=null;this.hideGuide();});
    addEventListener('load',()=>setTimeout(()=>this.maybeShowInstallGuide(),1200),{once:true});
  }
  maybeShowInstallGuide(){
    if(this.isStandalone()||!this.isMobileOrTablet()||sessionStorage.getItem('pwa-guide-dismissed')==='1'||this.guide)return;
    const canInstall=!!this.installEvent,isIos=/iPad|iPhone|iPod/.test(navigator.userAgent),message=canInstall?'このシミュレーターをPWAとして端末に追加できます。':isIos?'共有ボタンから「ホーム画面に追加」を選ぶとPWAとして使えます。':'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選べます。';
    const style=document.createElement('style');style.textContent='.pwa-guide{position:fixed;z-index:300;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);display:grid;grid-template-columns:1fr auto;gap:10px;width:min(440px,calc(100% - 24px));padding:13px;border:1px solid #5ebfe7;border-radius:14px;background:#0b1c2af2;color:#edf8ff;box-shadow:0 14px 44px #000c;backdrop-filter:blur(12px);font:600 13px/1.5 system-ui,sans-serif}.pwa-guide p{grid-column:1/-1;margin:0}.pwa-guide button{min-height:42px;border:1px solid #5f829b;border-radius:9px;background:#142c3e;color:#eff9ff;font-weight:800}.pwa-guide .pwa-install{background:#17627e;border-color:#69d9ff}';document.head.append(style);
    const guide=document.createElement('aside');guide.className='pwa-guide';guide.setAttribute('aria-label','PWAインストール案内');guide.innerHTML=`<p>${message}</p>${canInstall?'<button class="pwa-install" type="button">インストール</button>':''}<button class="pwa-close" type="button">あとで</button>`;document.body.append(guide);this.guide=guide;this.guideStyle=style;
    guide.querySelector('.pwa-close').onclick=()=>{sessionStorage.setItem('pwa-guide-dismissed','1');this.hideGuide();};const install=guide.querySelector('.pwa-install');if(install)install.onclick=()=>this.promptInstall();
  }
  async promptInstall(){if(!this.installEvent)return;this.installEvent.prompt();await this.installEvent.userChoice;this.installEvent=null;this.hideGuide();}
  hideGuide(){this.guide?.remove();this.guideStyle?.remove();this.guide=null;this.guideStyle=null;}
}
