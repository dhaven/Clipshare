var Twitter = require('../controllers/twitter.js');
const config = require('../config');
var T = new Twitter(config.twitter.consumer_key,config.twitter.consumer_key_secret)

module.exports = function(job){
  return T.tweet_video(job.data.token,job.data.video_id, job.data.message);
}
