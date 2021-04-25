const path = require('path');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const { MongoClient } = require("mongodb");
const config = require('../config');
const { DynamoDB } = require("@aws-sdk/client-dynamodb");

module.exports = function(job){
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
      const client = new DynamoDB({ region: config.dynamodb.region});
      var params = {
        Key: {
         "user_id": {
           S: job.data.user_id
          }
        },
        UpdateExpression: "SET edit = :edit, trimmed_video_id = :trim_vid",
        ExpressionAttributeValues: {
          ":trim_vid": {
          	S: trimmed_video_id
          }, 
          ":edit": {
          	M: {
          		"active": {
          			BOOL: false
          		},
          		"start": {
          			N: "" + job.data.startPercent
          		},
          		"end": {
          			N: "" + job.data.endPercent
          		}
          	}
          }
        }, 
        ReturnConsumedCapacity: "TOTAL", 
        TableName: config.dynamodb.table
       };
      client.updateItem(params, function(err, data) {
        if (err){
          console.log(err, err.stack); // an error occurred
          reject(err)
        }else{
          console.log(data);           // successful response
          resolve(trimmed_video_id)
        } 
      });
    });

    ffmpegProcess.on('error', error => {
      console.error(`Fatal error occurred: ${error}`)
      reject(error)
    })
  });
  return promise;
}
