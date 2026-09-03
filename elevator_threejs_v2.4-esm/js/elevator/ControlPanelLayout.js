export class ControlPanelLayout {
  static forCount(value){
    const count=Math.max(1,Number(value)||1),columns=count<=4?1:count<=12?2:count<=24?3:count<=40?4:5,rows=Math.ceil(count/columns);
    return {count,columns,rows,density:count<=12?'roomy':count<=30?'normal':'compact',panelWidth:Math.min(.46,Math.max(.32,columns*.08+.10)),panelHeight:Math.max(.72,.42+rows*.095)};
  }
}
