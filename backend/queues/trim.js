const path = require('path');
var CryptoJS = require("crypto-js");
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');

module.exports = function(job){
  let video_id = job.data.video_id;
  let start = job.data.start;
  let duration = job.data.duration;
  let media_path = path.join(__dirname,'../media',video_id)
  let mp_source_video = path.join(media_path,video_id + ".mp4")
  let mp_upload_video = path.join(media_path,video_id + "-short.mp4")
  let promise = new Promise((resolve,reject) => {
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
      resolve('the video was successfully trimmed')
    });
  });
  return promise;
}
