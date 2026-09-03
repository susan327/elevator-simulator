export class AutomaticOperationController {
  constructor(manager,config){this.manager=manager;this.config=config;this.elapsed=0;}
  setEnabled(enabled){this.config.enabled=!!enabled;this.elapsed=0;}
  update(dt){if(!this.config.enabled)return;this.elapsed+=dt;if(this.elapsed>=this.config.spawnInterval){this.elapsed=0;this.manager.spawn(this.config.currentPattern());}}
}
