const path = require('path');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const { MongoClient } = require("mongodb");
const config = require('../config');

module.exports = function(job){
  const uri = `mongodb://${config.mongodb.host}:${config.mongodb.port}/?compressors=zlib&gssapiServiceName=mongodb`;
  const DBclient = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  let video_id = job.data.video_id;
  let trimmed_video_id = job.data.trimmed_video_id;
  let start = job.data.startTime;
  let duration = job.data.duration;
  let media_path = path.join(__dirname,'../media')
  let mp_source_video = path.join(media_path,video_id + ".mp4")
  let mp_upload_video = path.join(media_path,trimmed_video_id + ".mp4")
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
      DBclient.connect()
        .then(function(){
          const database = DBclient.db('clipshare');
          const users = database.collection('user');
          users.updateOne({ _id: job.data.user_id},
            {
              $set: { 
                'edit': {
                  'active': false, 
                  'start': job.data.startPercent, 
                  'end': job.data.endPercent
                }, 
                'trimmed_video_id': trimmed_video_id 
              },
              $currentDate: { 
                lastModified: true 
              }
            })
            .then(response => {
              //DBclient.close();
              resolve(trimmed_video_id)
            }).catch(error => {
              //DBclient.close();
              console.error(`Fatal error occurred: ${error}`)
              reject(error)
            });
          })
        .catch(error => {
          console.error(`Fatal error occurred: ${error}`)
          reject(error)
        })
    });

    ffmpegProcess.on('error', error => {
      console.error(`Fatal error occurred: ${error}`)
      reject(error)
    })
  });
  return promise;
}
