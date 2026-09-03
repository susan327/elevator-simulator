import * as THREE from 'three';
export class PassengerRenderer {
  constructor(scene,building){this.scene=scene;this.building=building;this.visuals=new Map();this.version=0;this.colors=[0x3976a8,0x8f4e45,0x447a58,0x84629b,0xa27b38];}
  material(color){return new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.03});}
  create(passenger,shaftX){const group=new THREE.Group(),color=this.colors[passenger.id%this.colors.length];const body=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.55,8),this.material(color));body.position.y=.42;group.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.115,10,8),this.material(0xd5ab89));head.position.y=.96;group.add(head);this.building.floorGroups[passenger.origin].add(group);group.position.set(shaftX+(passenger.id%2?.52:-.52),0,2.05+(passenger.id%3)*.18);group.scale.setScalar(.86);this.visuals.set(passenger.id,group);this.version++;}
  beginBoarding(passenger,unit){const g=this.visuals.get(passenger.id);if(!g)return;passenger.visualStart=g.position.clone();passenger.visualEnd=new THREE.Vector3(this.building.getShaftCenter(unit.id),0,1.54);}
  reassignWaiting(passenger,unit){const g=this.visuals.get(passenger.id);if(!g)return;g.position.x=this.building.getShaftCenter(unit.id)+(passenger.id%2?.52:-.52);this.version++;}
  board(passenger,unit,slot){const g=this.visuals.get(passenger.id);if(!g)return;g.removeFromParent();unit.car.group.add(g);const col=slot%3,row=Math.floor(slot/3);g.position.set((col-1)*.30,0,-.08-row*.26);g.rotation.y=Math.PI;}
  beginExit(passenger,unit){const g=this.visuals.get(passenger.id);if(!g)return;g.removeFromParent();this.building.floorGroups[passenger.destination].add(g);g.position.set(this.building.getShaftCenter(unit.id),0,1.48);passenger.visualStart=g.position.clone();passenger.visualEnd=new THREE.Vector3(g.position.x+(passenger.id%2?.95:-.95),0,2.65);}
  updateTransition(passenger,progress){const g=this.visuals.get(passenger.id);if(!g||!passenger.visualStart)return;const t=THREE.MathUtils.smoothstep(progress,0,1);g.position.lerpVectors(passenger.visualStart,passenger.visualEnd,t);this.version++;}
  remove(passenger){const g=this.visuals.get(passenger.id);if(!g)return;g.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});g.removeFromParent();this.visuals.delete(passenger.id);}
  dispose(){for(const [id] of this.visuals)this.remove({id});}
}
