var CryptoJS = require("crypto-js");
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const readline = require('readline');

module.exports = function(job){
  const url = job.data.url;
  // replace 'progress by the actual io connection'
  //global.io.emit('progress', { progress: 0, jobId: job.data.id });
  const video_id = job.data.uuid
  let media_path = path.join(__dirname,'../media')
  let mp_source_video = path.join(media_path,video_id + ".mp4")
  let promise = new Promise((resolve,reject) => {
    if (!fs.existsSync(mp_source_video)) {
      //download the video and convert it to streamable format
      const video = ytdl(url);
      process.stdout.write('downloading video...');
      video.pipe(fs.createWriteStream(mp_source_video)).on('finish', () => {
        resolve(video_id)
      })
    }else{
      console.log("video was found on server so returning videoid")
      resolve(video_id)
    }
  });
  return promise;
}
