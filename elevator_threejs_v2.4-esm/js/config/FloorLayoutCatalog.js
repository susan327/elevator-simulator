export class FloorLayoutCatalog {
  static roomNames(profile){
    const type=profile.type;
    if(type==='clinic')return ['受付・待合','診察・処置'];
    if(type==='hotel')return ['客室・宿泊区画','サービス室'];
    if(type==='cafe')return ['客席・ラウンジ','厨房・バックヤード'];
    if(type==='meeting')return ['会議・宴会室','準備・控室'];
    if(type==='lounge')return ['ラウンジ','付帯施設'];
    if(type==='executive')return ['役員・応接室','秘書・管理室'];
    if(type==='signature')return profile.zone==='ENTRANCE'?['総合受付','セキュリティ・管理']:profile.zone==='TRANSFER'?['乗換ラウンジ','案内・サービス']:['展望施設','設備・サービス'];
    return ['執務エリア','会議・サポート'];
  }
  static get(template,floor,profile){
    const names=this.roomNames(profile),isEntrance=profile.zone==='ENTRANCE';
    return {
      id:`${template}-${floor}f`,template,floor,
      // 歩行開始地点は必ず共用廊下内に置く。入口の演出物の奥から始めると
      // 歩行可能エリア外になり、衝突判定で最初の一歩が止まってしまう。
      spawn:{x:0,y:0,z:5.15,rotation:Math.PI},
      walkable:[
        {id:'elevator-lobby',label:'エレベーターロビー',kind:'lobby',bounds:{minX:-5.35,maxX:5.35,minZ:1.72,maxZ:4.35}},
        {id:'main-corridor',label:'共用廊下',kind:'corridor',bounds:{minX:-5.35,maxX:5.35,minZ:4.35,maxZ:7.15}},
        {id:'left-room',label:names[0],kind:'room',bounds:{minX:-5.35,maxX:-.42,minZ:7.15,maxZ:9.92}},
        {id:'right-room',label:names[1],kind:'room',bounds:{minX:.42,maxX:5.35,minZ:7.15,maxZ:9.92}}
      ],
      portals:[
        {id:'elevator-a',kind:'elevator',x:-1.42,z:1.82,target:'A'},
        {id:'elevator-b',kind:'elevator',x:1.42,z:1.82,target:'B'},
        {id:'left-room-door',kind:'door',x:-2.65,z:7.15,target:'left-room'},
        {id:'right-room-door',kind:'door',x:2.65,z:7.15,target:'right-room'}
      ],
      blockers:[
        {id:'left-front-wall',bounds:{minX:-5.35,maxX:-3.18,minZ:7.05,maxZ:7.25}},
        {id:'left-inner-wall',bounds:{minX:-2.12,maxX:-.42,minZ:7.05,maxZ:7.25}},
        {id:'center-wall',bounds:{minX:-.42,maxX:.42,minZ:7.05,maxZ:7.25}},
        {id:'right-inner-wall',bounds:{minX:.42,maxX:2.12,minZ:7.05,maxZ:7.25}},
        {id:'right-front-wall',bounds:{minX:3.18,maxX:5.35,minZ:7.05,maxZ:7.25}}
      ]
    };
  }
}
