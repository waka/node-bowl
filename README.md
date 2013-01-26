# Bowl

Bowl is a Node.js module for running worker script in multi-core using "cluster" module.

Bowl provides a monitoring mechanism to check worker process, and restart workers gracefully.
In addition, it is also possible to hot deploy detecting a change in the directory or file, and extend the master process by plugin scripts.


## Usage

### By CLI

Please see help.

```sh
% bowl -h
// display how to specify options and can be specified
```

### By module

/path/to/project/index.js

```javascript
var Bowl = require('bowl');

var bowl = new Bowl({
  exec: './app.js',
  forks: require('os').cpus().length,
  watch: ['app', 'lib', 'app.js'],
  plugins: ['plugins/foo.js', 'plugins/bar.js']
});

bowl.start(function(err) {
  console.log('Bowl has started');
});
```

