exports.included = function(saucer) {
  saucer.emit('plugin.included');
};

exports.dispose = function(saucer) {
  saucer.emit('plugin.dispose');
};
