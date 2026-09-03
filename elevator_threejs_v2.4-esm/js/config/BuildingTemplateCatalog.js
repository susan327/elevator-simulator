const palettes={
  entrance:{wall:0xe4d9ca,floor:0xc9b79f,ceiling:0xf2ece4,trim:0x806b55,accent:0x957252,material:'entranceStone'},
  medical:{wall:0xe4ece9,floor:0xc7d5d1,ceiling:0xf5f8f6,trim:0x789791,accent:0x71a59c,material:'medicalVinyl'},
  office:{wall:0xd9d2c8,floor:0xbdb4a8,ceiling:0xeee9e1,trim:0x7b7063,accent:0x6d7b80,material:'officeCarpetBlue'},
  sky:{wall:0xcbd8d8,floor:0xaebbbb,ceiling:0xe6eeee,trim:0x66797d,accent:0x58747c,material:'designTerrazzo'},
  hotel:{wall:0xd8ccb9,floor:0x9b8975,ceiling:0xf0e8db,trim:0x79634c,accent:0x8e6846,material:'hotelCarpetTaupe'},
  dining:{wall:0xd8c8bd,floor:0x806c60,ceiling:0xeee3da,trim:0x6e5141,accent:0xa06c3f,material:'executiveOak'},
  station:{wall:0xd6dde0,floor:0xaab2b5,ceiling:0xe9eef0,trim:0x59666d,accent:0x397b91,material:'designTerrazzo'},
  ryokan:{wall:0xd8ceb9,floor:0xa9997d,ceiling:0xeee8dc,trim:0x675c49,accent:0x776c45,material:'executiveOak'}
};
const profile=(type,zone,name,palette,scene=null)=>({type,zone,name,...(scene?{scene}:{}),...palettes[palette]});

export class BuildingTemplateCatalog {
  static definitions={
    office20:{label:'20階オフィス',shortLabel:'OFFICE 20',floors:20,floorHeight:3.6,services:{A:'1-10',B:'1,2,10-20'},transferFloors:[10]},
    office30:{label:'30階複合オフィス',shortLabel:'OFFICE 30',floors:30,floorHeight:3.6,services:{A:'1-15',B:'1,2,15-30'},transferFloors:[15]},
    hospital:{label:'総合病院',shortLabel:'HOSPITAL',floors:12,floorHeight:3.8,services:{A:'1-12',B:'1-12'},transferFloors:[]},
    hotel:{label:'高層ホテル',shortLabel:'HOTEL',floors:25,floorHeight:3.6,services:{A:'1-12',B:'1,2,12-25'},transferFloors:[12]},
    ryokan:{label:'温泉旅館',shortLabel:'RYOKAN',floors:8,floorHeight:3.3,services:{A:'1-8',B:'1-8'},transferFloors:[]},
    stationFront:{label:'駅前複合施設',shortLabel:'STATION FRONT',floors:18,floorHeight:3.8,services:{A:'1-9',B:'1,2,9-18'},transferFloors:[9]}
  };
  static get(key){return this.definitions[key]||this.definitions.office30;}
  static list(){return Object.entries(this.definitions).map(([key,value])=>({key,...value}));}
  static floorProfile(key,floor){const def=this.get(key),f=Number(floor),top=def.floors;if(f===1)return profile('signature','ENTRANCE',key==='hospital'?'総合受付・救急受付':key==='stationFront'?'駅前エントランス':key==='ryokan'?'玄関・帳場':'MAIN ENTRANCE','entrance','entrance');if(def.transferFloors.includes(f))return profile('signature','TRANSFER',`${f}F 乗換ロビー`,'sky','skyLobby');if(f===top)return profile('signature','PREMIUM',key==='hospital'?'ヘリポート連絡・特別病棟':key==='ryokan'?'展望露天風呂':key==='stationFront'?'展望レストラン':key==='hotel'?'スカイレストラン':'展望ラウンジ','dining','observationLounge');
    if(key==='hospital'){if(f===2)return profile('clinic','MEDICAL','外来受付・会計','medical');if(f<=4)return profile('clinic','MEDICAL',`${f}F 外来診療科`,'medical');if(f===5)return profile('clinic','MEDICAL','検査・画像診断','medical');if(f===6)return profile('clinic','MEDICAL','手術・集中治療','medical');if(f<=10)return profile('hotel','WARD',`${f}F 入院病棟`,'medical');return profile('lounge','MEDICAL','リハビリ・職員エリア','medical');}
    if(key==='ryokan'){if(f===2)return profile('cafe','DINING','食事処・宴会場','ryokan');if(f===3)return profile('lounge','WELLNESS','大浴場・湯上がり処','ryokan');return profile('hotel','GUEST ROOMS',`${f}F 客室`,'ryokan');}
    if(key==='hotel'){if(f===2)return profile('cafe','COMMON','ロビーラウンジ・カフェ','hotel');if(f<=11)return profile('meeting','BANQUET',f<=5?'宴会・会議フロア':`${f}F ホテルオフィス`,'hotel');if(f<=22)return profile('hotel','HOTEL',`${f}F 客室`,'hotel');if(f===23)return profile('lounge','WELLNESS','フィットネス・スパ','hotel');return profile('cafe','DINING','レストラン・バー','dining');}
    if(key==='stationFront'){if(f===2)return profile('cafe','RETAIL','駅前商業・フードホール','station');if(f<=5)return profile('cafe','RETAIL',`${f}F ショップ・サービス`,'station');if(f<=8)return profile('clinic','MEDICAL',`${f}F クリニックモール`,'medical');if(f<=15)return profile('office','OFFICE',`${f}F オフィス`,'office');return profile('hotel','HOTEL',`${f}F ビジネスホテル`,'hotel');}
    if(key==='office30'){if(f===2)return profile('cafe','COMMON','カフェ・総合受付','dining');if(f<=5)return profile('clinic','MEDICAL',f===5?'健診センター':`${f}F クリニック`,'medical');if(f<=14)return profile([10,12].includes(f)?'meeting':'office','LOW-RISE OFFICE',f===10?'大会議フロア':f===12?'研修センター':`${f}F オフィス`,'office');if(f<=20)return profile(f===20?'executive':'office','UPPER OFFICE',f===20?'役員受付':`${f}F 上層オフィス`,'office');if(f<=24)return profile('hotel','HOTEL',f===21?'ホテル受付':`${f}F ホテル客室`,'hotel');if(f<=26)return profile('lounge','WELLNESS',f===25?'フィットネス':'スパ・ラウンジ','hotel');return profile(f===28?'meeting':f===29?'lounge':'cafe',f===28?'BANQUET':f===29?'VIEW':'DINING',f===27?'レストラン':f===28?'宴会場':'展望ラウンジ','dining');}
    if(f===2)return profile('cafe','COMMON','カフェ・来客受付','dining');if(f<=top-3)return profile(f%5===0?'meeting':'office','OFFICE',f%5===0?'会議・研修フロア':`${f}F オフィス`,'office');return profile('executive','EXECUTIVE',`${f}F 役員・応接フロア`,'dining');
  }
}
