const path = require('path');
var Twitter = require('../controllers/twitter.js');
const config = require('../config');
var T = new Twitter(config.twitter.consumer_key,config.twitter.consumer_key_secret)
const AWSLib = require('../controllers/aws.js')
const AWS = new AWSLib(config)

module.exports = function(job){
  let media_path = path.join(__dirname,'../media')
  let mp_source_video = path.join(media_path,job.data.video_id+ ".mp4") //temp location for video to tweet
  let promise = new Promise((resolve,reject) => {
     //1. Download video from S3
     AWS.s3_get_object(job.data.video_id + ".mp4", mp_source_video, 'edit')
      .then(data => {
        //2. Tweet video
        T.tweet_video(job.data.token,mp_source_video, job.data.message)
          .then(data => {
            fs.unlink(mp_source_video, (err) => {
							if (err) throw err;
						});
            //3. Update DB with result of tweet
            let text_str = data.text.split(" ")
            let tweet_url = text_str[text_str.length -1]
            AWS.dynamoDB_put_tweet(job.data.user_id, tweet_url)
              .then(data => {
                resolve(data)
              })
              .catch(error => {
				        reject(error)
              })
          })
          .catch(error => {
				    reject(error)
          })
      })
      .catch(error => {
				reject(error)
      })
  });
  return promise
}
