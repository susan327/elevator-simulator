class ControlPanelLayout {
  static forCount(value){const count=Math.max(1,Number(value)||1),columns=count<=4?1:count<=12?2:count<=24?3:count<=40?4:5;return {count,columns,rows:Math.ceil(count/columns),density:count<=12?'roomy':count<=30?'normal':'compact'};}
}
