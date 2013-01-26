//
var Bowl = require('../lib/saucer.js');

var bowl = new Bowl({
  exec: 'sample/worker.js',
  plugins: ['sample/plugin1.js'],
  loglevel: 'info',
  logdir: 'sample/log'
});

console.log('Bowl version: ' + Bowl.version);
bowl.run();
