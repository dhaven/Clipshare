const path = require('path');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const config = require('../config');
const AWSLib = require('../controllers/aws.js')
const AWS = new AWSLib(config)

module.exports = function(job){
  let video_id = job.data.video_id;
  let trimmed_video_id = job.data.trimmed_video_id;
  let start = job.data.startTime;
  let duration = job.data.duration;
  let media_path = path.join(__dirname,'../media')
  let mp_source_video = path.join(media_path,video_id + ".mp4") //temp location for original video
  let mp_upload_video = path.join(media_path,trimmed_video_id + ".mp4") //temp location for trimmed video

  let promise = new Promise((resolve,reject) => {
    //1. fetch video from s3
    AWS.s3_get_object(video_id + ".mp4", mp_source_video, 'raw')
    .then(data => {
      //2. Trim video and save to file
      const ffmpegProcess = cp.spawn(ffmpeg, [
        '-y', '-ss', start,
        '-i', mp_source_video,
        '-to', duration,
        '-c', 'copy', mp_upload_video,
        ], {
          windowsHide: true,
          stdio: [
            'inherit', 'inherit', 'inherit',
            'pipe', 'pipe',
          ],
      });
      ffmpegProcess.on('close', () => {
        process.stdout.write(`\nsaved to ${mp_upload_video}\n`);
        //3. Upload trimmed video to S3
        AWS.s3_put_object(trimmed_video_id + ".mp4", mp_upload_video, 'edit')
          .then(data => {
            fs.unlink(mp_upload_video, (err) => {
							if (err) throw err;
							console.log(`successfully deleted ${mp_upload_video} from local storage`);
						});
            //4. Update user data with new trimmed video and submit stage
            AWS.dynamoDB_update_trim(job.data.user_id, trimmed_video_id)
              .then(data => {
                resolve(trimmed_video_id)
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
      });
      ffmpegProcess.on('error', error => {
        console.error(`Fatal error occurred: ${error}`)
        reject(error)
      })
    })
    .catch(error => {
      console.log(error); // an error occurred
      reject(error)
    })
  });
  return promise
}
