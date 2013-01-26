exports.included = function(bowl) {
  bowl.getLogger().info('included plugin1');
};

exports.dispose = function(bowl) {
  bowl.getLogger().info('disposed plugin1');
};
