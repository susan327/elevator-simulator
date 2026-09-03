import {BuildingTemplateCatalog} from '../config/BuildingTemplateCatalog.js';

// 既存の参照名を保ちつつ、建物種別に依存しないテンプレートカタログへ委譲する。
export class OfficeFloorCatalog {
  static get(floor,template='office30'){return BuildingTemplateCatalog.floorProfile(template,floor);}
}
