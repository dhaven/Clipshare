const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const config = require('../config');
const { DynamoDB } = require("@aws-sdk/client-dynamodb");

module.exports = function(job){
  const video_id = job.data.uuid
  let media_path = path.join(__dirname,'../media')
  let mp_source_video = path.join(media_path,video_id + ".mp4")
  let promise = new Promise((resolve,reject) => {
    const video = ytdl(job.data.url);
    video.pipe(fs.createWriteStream(mp_source_video))
      .on('finish', () => {
        const client = new DynamoDB({ region: config.dynamodb.region});
        var params = {
        	ExpressionAttributeNames: {
        	 "#V_ID": "video_id", 
        	 "#V_URL": "video_url",
        	 "#EDIT": "edit"
        	}, 
        	ExpressionAttributeValues: {
        	 ":v_id": {
        		 S: video_id
        		}, 
        	 ":v_url": {
        		 S: job.data.url
        		},
        	 ":edit": {
        		 M: {
        			 "active": {
        				 BOOL: true
        			 },
        			 "start": {
        				N: "0.0"
        			 },
        			 "end": {
        				N: "1.0"
        			 }
        		 }
        	 }
        	}, 
        	Key: {
        	 "user_id": {
        		 S: job.data.user_id
        		}
        	}, 
        	ReturnValues: "ALL_NEW", 
        	TableName: config.dynamodb.table, 
        	UpdateExpression: "SET #V_ID = :v_id, #V_URL = :v_url, #EDIT = :edit"
         };
         client.updateItem(params, function(err, data) {
        	 if (err){
            console.log(err, err.stack); // an error occurred
            reject(err)
           }else{
            console.log(data);           // successful response
            resolve(video_id)
           }
         }); 
      })
      .on('error', error => {
        console.error(`Fatal error occurred: ${error}`)
        reject(error)
      })
  });
  return promise;
}