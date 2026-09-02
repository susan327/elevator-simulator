const CACHE_NAME='elevator-simulator-v4';
const CORE_ASSETS=['./','./index.html','./manifest.webmanifest','./pwa-icon.svg','./motor-sound-generator.html','./motor-sound-generator.js','./motor-sound-preset.json','./elevator_threejs_v2.4/index.html','./elevator_threejs_v2.4/css/style.css','./elevator_threejs_v2.4/js/main.js','./elevator_threejs_v2.4/js/audio/ElevatorSoundConfig.js','./elevator_threejs_v2.4/js/audio/ToneSynth.js','./elevator_threejs_v2.4/js/audio/AudioManager.js','./elevator_threejs_v2.4/js/config/FloorServiceConfig.js','./elevator_threejs_v2.4/js/config/ElevatorSystemConfig.js','./elevator_threejs_v2.4/js/core/SimulationClock.js','./elevator_threejs_v2.4/js/core/SceneManager.js','./elevator_threejs_v2.4/js/core/CameraController.js','./elevator_threejs_v2.4/js/world/BuildingBuilder.js','./elevator_threejs_v2.4/js/elevator/ElevatorGeometryConfig.js','./elevator_threejs_v2.4/js/elevator/ElevatorCar.js','./elevator_threejs_v2.4/js/elevator/DoorController.js','./elevator_threejs_v2.4/js/control/CallController.js','./elevator_threejs_v2.4/js/elevator/MotionPlanner.js','./elevator_threejs_v2.4/js/elevator/ElevatorController.js','./elevator_threejs_v2.4/js/ui/UIController.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),freshAsset=url.origin===self.location.origin&&['document','script','style','manifest'].includes(event.request.destination);
  if(freshAsset){
    event.respondWith(fetch(event.request).then(response=>{
      if(response&&response.status===200)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone()));
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(!response||(response.status!==200&&response.type!=='opaque'))return response;
    const copy=response.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
    return response;
  }).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
