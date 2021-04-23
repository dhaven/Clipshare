const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const { MongoClient } = require("mongodb");
const config = require('../config');

module.exports = function(job){
  const uri = `mongodb://${config.mongodb.host}:${config.mongodb.port}/?compressors=zlib&gssapiServiceName=mongodb`;
  const DBclient = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const video_id = job.data.uuid
  let media_path = path.join(__dirname,'../media')
  let mp_source_video = path.join(media_path,video_id + ".mp4")
  let promise = new Promise((resolve,reject) => {
    const video = ytdl(job.data.url);
    video.pipe(fs.createWriteStream(mp_source_video))
      .on('finish', () => {
        DBclient.connect()
          .then(() => {
            const database = DBclient.db('clipshare');
            const users = database.collection('user');
            users.updateOne({ _id: job.data.user_id },
              {
                $set: {
                  'video_id': video_id,
                  'video_url': job.data.url,
                  'edit': {
                    'active': true,
                    'start': 0.0,
                    'end': 1.0,
                  }
                },
                $currentDate: { lastModified: true }
              })
              .then(response => {
                resolve(video_id)
                //DBclient.close();
              }).catch(error => {
                console.error(`Fatal error occurred: ${error}`)
                reject(error)
                //DBclient.close();
              });
          })
          .catch(error => {
            reject(error)
            console.error(`Fatal error occurred: ${error}`)
          })
      })
      .on('error', error => {
        console.error(`Fatal error occurred: ${error}`)
        reject(error)
      })
  });
  return promise;
}