var Farseer = require('./lib/index.js').default;
var farseer = new Farseer();
farseer.on('game-start', console.log.bind(console, 'game-start'));
farseer.on('game-over', console.log.bind(console, 'game-over:'));
farseer.on('zone-change', console.log.bind(console, 'zone-change:'));
farseer.on('pack-opened', console.log.bind(console, 'pack-opened:'));
farseer.start();
