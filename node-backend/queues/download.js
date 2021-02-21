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
  console.log(url);
  let video_id = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(url));
  let media_path = path.join(__dirname,'../media',video_id)
  let mp_source_video = path.join(media_path,video_id + ".mp4")
  let mp_stream_video = path.join(media_path,video_id + ".m3u8")
  let promise = new Promise((resolve,reject) => {
    if (!fs.existsSync(media_path)) {
      let dir = fs.mkdirSync(media_path);
      //download the video and convert it to streamable format
      const video = ytdl(url);
      process.stdout.write('downloading video...');
      // video.on('progress', (chunkLength, downloaded, total) => {
      //   const percent = downloaded / total;
      //   //readline.cursorTo(process.stdout, 0);
      //   //process.stdout.write(`downloading video... ${(percent * 100).toFixed(2)}%`);
      //   global.io.emit(job.data.ws + "-progress", { percent, jobId: job.data.id });
      //   if (percent >= 1) {
      //     global.io.emit(job.data.ws + "-progress", { percent: 1, jobId: job.data.id });
      //   }
      // });
      video.pipe(fs.createWriteStream(mp_source_video)).on('finish', () => {
        resolve(video_id)
      })
      // video.pipe(fs.createWriteStream(mp_source_video)).on('finish', () => {
      //   const ffmpegProcess = cp.spawn(ffmpeg, [
      //     '-i', mp_source_video,
      //     '-c:a', 'libmp3lame', '-ar', '48000', '-ab', '64k',  '-c:v', 'libx264',
      //     '-b:v', '128k', '-flags', '-global_header', '-map', '0', '-f', 'segment',
      //     '-segment_list', mp_stream_video, '-segment_time', '30', '-segment_format', 'mpegts', `${media_path}/segment_%05d.ts`
      //   ], {
      //     windowsHide: true,
      //     stdio: [
      //       'inherit', 'inherit', 'inherit',
      //       'pipe', 'pipe',
      //     ],
      //   })
      //   process.stdout.write('\n');
      //   ffmpegProcess.on('close', () => {
      //     process.stdout.write(`\nsaved to ${mp_stream_video}\n`);
      //     resolve(video_id)
      //   });
      // });
    }else{
      console.log("video was found on server so returning videoid")
      resolve(video_id)
    }
  });
  return promise;
  //return Promise.resolve(result);
}
