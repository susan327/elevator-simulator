export class OfficeFloorCatalog {
  static palette(type){return ({medical:{wall:0xe4ece9,floor:0xc7d5d1,ceiling:0xf5f8f6,trim:0x789791,accent:0x71a59c},office:{wall:0xd9d2c8,floor:0xbdb4a8,ceiling:0xeee9e1,trim:0x7b7063,accent:0x6d7b80},sky:{wall:0xcbd8d8,floor:0xaebbbb,ceiling:0xe6eeee,trim:0x66797d,accent:0x58747c},hotel:{wall:0xd8ccb9,floor:0x9b8975,ceiling:0xf0e8db,trim:0x79634c,accent:0x8e6846},dining:{wall:0xd8c8bd,floor:0x806c60,ceiling:0xeee3da,trim:0x6e5141,accent:0xa06c3f}})[type];}
  static get(floor){
    const f=Number(floor),special={
      1:{type:'signature',zone:'ENTRANCE',name:'MAIN ENTRANCE',scene:'entrance',...this.palette('office')},
      2:{type:'cafe',zone:'COMMON',name:'CAFE & GENERAL RECEPTION',...this.palette('dining')},
      15:{type:'signature',zone:'TRANSFER',name:'SKY LOBBY & DINING',scene:'skyLobby',...this.palette('sky')},
      21:{type:'lounge',zone:'HOTEL',name:'HOTEL RECEPTION',...this.palette('hotel')},
      25:{type:'lounge',zone:'WELLNESS',name:'FITNESS & WELLNESS',...this.palette('sky')},
      26:{type:'lounge',zone:'WELLNESS',name:'SPA LOUNGE',...this.palette('hotel')},
      27:{type:'cafe',zone:'DINING',name:'SKY RESTAURANT',...this.palette('dining')},
      28:{type:'meeting',zone:'BANQUET',name:'BANQUET HALL',...this.palette('dining')},
      29:{type:'lounge',zone:'VIEW',name:'OBSERVATION LOUNGE',...this.palette('sky')},
      30:{type:'signature',zone:'PREMIUM',name:'OBSERVATION RESTAURANT',scene:'observationLounge',wall:0xaebfca,floor:0x727d86,ceiling:0xdbe4e9,trim:0x435866,accent:0x385d75}
    };if(special[f])return special[f];
    if(f>=3&&f<=5)return {type:'clinic',zone:'MEDICAL',name:f===3?'CLINIC RECEPTION':f===4?'OUTPATIENT CLINIC':'HEALTH CHECK CENTER',...this.palette('medical')};
    if(f>=22&&f<=24)return {type:'hotel',zone:'HOTEL',name:`HOTEL GUEST ROOMS ${f}F`,...this.palette('hotel')};
    if(f>=16&&f<=20)return {type:f===20?'executive':'office',zone:'UPPER OFFICE',name:f===20?'EXECUTIVE RECEPTION':`UPPER OFFICE ${f}F`,...this.palette('office')};
    if(f>=6&&f<=14)return {type:[10,12].includes(f)?'meeting':'office',zone:'LOW-RISE OFFICE',name:f===10?'CONFERENCE CENTER':f===12?'TRAINING CENTER':`OFFICE ${f}F`,...this.palette('office')};
    return null;
  }
}
