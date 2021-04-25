const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const config = require('../config');

router.get('/', (req, res, _next) => {
	 let video_id = uuidv4()
	 req.queues.download.add('download_job',{
		 uuid: video_id,
		 url: req.query.url,
		 ws: req.query.ws,
		 user_id: req.query.user_id
	 })
	 res.json({
			 message: 'video added to download queue'
	 });
});

router.post('/trim', (req, res, _next) => {
	const client = new DynamoDB({ region: config.dynamodb.region });
	var params = {
		Key: {
		 "user_id": {
			 S: req.body.user_id
			}
		}, 
		TableName: config.dynamodb.table
	 };
	client.getItem(params, function(err, data) {
		if (err){
			console.log(err, err.stack); // an error occurred
			res.status(500).send(error);
		}else{
			console.log(data)
			let trimmed_video_id = uuidv4()
      req.queues.trim.add('trim_job',{
        video_id: data.Item.video_id.S,
        trimmed_video_id: trimmed_video_id,
        startTime: req.body.startTime,
        startPercent: req.body.startPercent,
        duration: req.body.duration,
        endPercent: req.body.endPercent,
        ws: req.body.ws,
        user_id: req.body.user_id
      })
      res.json({
        message: 'video added to trim queue'
      });
		}
	});
});
module.exports = router;