class OfficeFloorCatalog {
  static get(floor){return ({
    1:{type:'signature',zone:'ENTRANCE',name:'MAIN ENTRANCE',scene:'entrance',wall:0xe4d9ca,floor:0xc9b79f,ceiling:0xf2ece4,trim:0x806b55,accent:0x957252},
    14:{type:'signature',zone:'CREATIVE',name:'DESIGN STUDIO',scene:'designStudio',wall:0xd8dbd7,floor:0xaeb3b0,ceiling:0xf0f2ef,trim:0x59666a,accent:0x4f7279},
    30:{type:'signature',zone:'PREMIUM',name:'OBSERVATION LOUNGE',scene:'observationLounge',wall:0xaebfca,floor:0x727d86,ceiling:0xdbe4e9,trim:0x435866,accent:0x385d75}
  })[Number(floor)]||null;}
}
