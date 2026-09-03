import * as THREE from 'three';
export class PassengerRenderer {
  constructor(scene,building){this.scene=scene;this.building=building;this.visuals=new Map();this.version=0;this.colors=[0x3976a8,0x8f4e45,0x447a58,0x84629b,0xa27b38];}
  material(color){return new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.03});}
  create(passenger){const group=new THREE.Group(),color=this.colors[passenger.id%this.colors.length];const body=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.55,8),this.material(color));body.position.y=.42;group.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.115,10,8),this.material(0xd5ab89));head.position.y=.96;group.add(head);this.building.floorGroups[passenger.origin].add(group);group.scale.setScalar(.86);this.visuals.set(passenger.id,group);this.version++;}
  layoutWaiting(passengers){passengers.forEach((passenger,index)=>{const g=this.visuals.get(passenger.id);if(!g)return;const col=index%4,row=Math.floor(index/4);g.position.set((col-1.5)*.38,0,2.65+row*.25);g.rotation.y=0;});this.version++;}
  beginApproach(passenger,unit,index=0){const g=this.visuals.get(passenger.id);if(!g)return;passenger.visualStart=g.position.clone();passenger.visualEnd=new THREE.Vector3(this.building.getShaftCenter(unit.id)+(index%2?.22:-.22),0,1.92+Math.floor(index/2)*.10);}
  beginBoarding(passenger,unit){const g=this.visuals.get(passenger.id);if(!g)return;passenger.visualStart=g.position.clone();passenger.visualEnd=new THREE.Vector3(this.building.getShaftCenter(unit.id),0,1.42);}
  returnToQueue(passenger){const g=this.visuals.get(passenger.id);if(!g)return;delete passenger.visualStart;delete passenger.visualEnd;g.rotation.y=0;this.version++;}
  board(passenger,unit,riderIds){const g=this.visuals.get(passenger.id);if(!g)return;g.removeFromParent();unit.car.group.add(g);g.rotation.y=Math.PI;this.layoutRiders(unit,riderIds);this.version++;}
  layoutRiders(unit,riderIds=new Set()){[...riderIds].forEach((id,slot)=>{const g=this.visuals.get(id);if(!g||g.parent!==unit.car.group)return;const col=slot%4,row=Math.floor(slot/4);g.position.set((col-1.5)*.34,0,-.12+row*.22);g.scale.setScalar(.78);});this.version++;}
  beginExit(passenger,unit){const g=this.visuals.get(passenger.id);if(!g)return;g.removeFromParent();this.building.floorGroups[passenger.destination].add(g);g.position.set(this.building.getShaftCenter(unit.id),0,1.42);g.rotation.y=0;g.scale.setScalar(.86);passenger.visualStart=g.position.clone();passenger.visualEnd=new THREE.Vector3(g.position.x+(passenger.id%2?.90:-.90),0,2.75+(passenger.id%3)*.12);this.version++;}
  updateTransition(passenger,progress){const g=this.visuals.get(passenger.id);if(!g||!passenger.visualStart)return;const t=THREE.MathUtils.smoothstep(progress,0,1);g.position.lerpVectors(passenger.visualStart,passenger.visualEnd,t);this.version++;}
  remove(passenger){const g=this.visuals.get(passenger.id);if(!g)return;g.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});g.removeFromParent();this.visuals.delete(passenger.id);}
  dispose(){for(const [id] of this.visuals)this.remove({id});}
}
