# Bowl

Clusterモジュールを利用した、ワーカースクリプトをマルチコアで利用するためのNode.jsモジュールです。  
コマンドラインからの利用とモジュールからの利用、両方サポートしています。  

ワーカープロセスの死活監視、ワーカーのGraceful restartを行います。  
また、指定したディレクトリ/ファイルの変更を検知してホットデプロイや、プラグインによるマスタープロセスの拡張も可能です。


## 使い方

### コマンドラインから使う

ヘルプ表示

```sh
% bowl -h
// 指定できるオプションや指定方法が表示されます
```

### モジュールとして使う

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

