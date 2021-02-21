var env = NODE_ENV || 'dev';

var config = {
  dev: require('./config-dev.js'),
  prod: require('./config-prod.js'),
};

module.exports = config[env];
