class ElevatorGeometryConfig {
  constructor(systemConfig){this.system=systemConfig;}
  get carHeight(){return this.system.carHeight;}
  get carWidth(){return this.system.carWidth;}
  get carDepth(){return this.system.carDepth;}
  get doorTotalWidth(){return this.system.doorWidth;}
  get doorPanelTotalWidth(){return this.doorTotalWidth+Math.max(.12,this.doorTotalWidth*.14);}
  get doorLeafWidth(){return this.doorPanelTotalWidth/2;}
  get doorHeight(){return this.system.doorHeight;}
  get windowWidth(){return this.system.windowWidth;}
  get windowHeight(){return this.system.windowHeight;}
  get windowTop(){return this.doorHeight-this.system.windowTopMargin;}
  get frameSide(){return THREE.MathUtils.clamp(this.doorTotalWidth*.16,.13,.19);}
  get frameTop(){return THREE.MathUtils.clamp(this.doorHeight*.075,.14,.19);}
  get pocketClearance(){return .04;}
  get pocketWidth(){return this.doorLeafWidth+this.pocketClearance*2;}
  get pocketCenterX(){return this.doorPanelTotalWidth/2+this.pocketWidth/2;}
  get frameOuterWidth(){return this.doorPanelTotalWidth+this.frameSide*2;}
  get frameOuterHeight(){return this.doorHeight+this.frameTop;}
  get openingWithPockets(){return this.frameOuterWidth+this.pocketWidth*2;}
  get controlPanelColumns(){const count=this.system.servedFloors?.length??this.system.floors;return count<=12?2:count<=24?3:count<=40?4:5;}
  get controlPanelWidth(){return Math.min(.58,Math.max(.36,this.controlPanelColumns*.105+.12));}
  get controlPanelSideWidth(){return this.controlPanelWidth+.10;}
  get doorCenterX(){return 0;}
  get minimumCarWidth(){return this.frameOuterWidth+this.controlPanelSideWidth*2;}
  get cabinDoorZ(){return 1.27;}
  get hallDoorZ(){return this.cabinDoorZ+.08;}
}
