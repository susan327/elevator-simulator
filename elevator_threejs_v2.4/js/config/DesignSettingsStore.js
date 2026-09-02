class DesignSettingsStore {
  constructor(storage=window.localStorage){this.storage=storage;this.key='elevator-design-v3';this.legacyKey='elevator-design-v2';}
  load(){try{const current=JSON.parse(this.storage.getItem(this.key)||'null');if(current)return {data:current,migrated:false};const legacy=JSON.parse(this.storage.getItem(this.legacyKey)||'null');if(!legacy)return null;return {data:legacy,migrated:true,useOffice30:!legacy.buildingPreset&&Number(legacy.floors)===20};}catch{return null;}}
  save(snapshot){try{this.storage.setItem(this.key,JSON.stringify({...snapshot,schemaVersion:3}));return true;}catch{return false;}}
}
