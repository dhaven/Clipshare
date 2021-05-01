const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const config = require('../config');
const AWSLib = require('../controllers/aws.js')
const AWS = new AWSLib(config)

module.exports = function(job){
  const video_id = job.data.uuid
  let media_path = path.join(__dirname,'../media')
  let mp_source_video = path.join(media_path,video_id + ".mp4") //temp location for downloaded video
  let promise = new Promise((resolve,reject) => {
    const video = ytdl(job.data.url);
    video.pipe(fs.createWriteStream(mp_source_video))
      .on('finish', () => {
				//1. Upload video to S3
				AWS.s3_put_object(video_id + ".mp4", mp_source_video, 'raw')
					.then(data => {
						fs.unlink(mp_source_video, (err) => {
							if (err) throw err;
							console.log(`successfully deleted ${mp_source_video} from local storage`);
						});
						//2. Update the dynamoDB info
						AWS.dynamoDB_update_video(job.data.user_id, video_id, job.data.url)
							.then(data => {
								resolve(video_id)
							})
							.catch(error => {
								console.log(error); // an error occurred
							 	reject(error)
							})
					})
					.catch(error => {
						console.log(error); // an error occurred
            reject(error)
					})
      })
      .on('error', error => {
        console.error(`Fatal error occurred: ${error}`)
        reject(error)
      })
  });
  return promise;
}