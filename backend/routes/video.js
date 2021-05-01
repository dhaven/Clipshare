const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

/*
	Adds a new item to the download queue.
	
	Request query params: 
		url: String      //The youtube url where the video is located
		ws: String       //The websocket on which to send the result after processing
		user_id: String  //The user which requested the video
	returns: {
		message: 'video added to download queue'
	}
*/
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

/*
	Adds a new item to the trim queue.
	
	Request body: 
		user_id: String       //The user which requested to trim a video
		startTime: String     //The time at which to start trimming
		duration: String      //The length of the trimmed video
		ws: String            //The websocket on which to send the result after processing
	returns: {
		message: 'video added to trim queue'
	}
*/
router.post('/trim', (req, res, _next) => {
	req.aws.dynamoDB_get_user(req.body.user_id)
		.then(data => {
			let trimmed_video_id = uuidv4()
      req.queues.trim.add('trim_job',{
        video_id: data.Item.video_id.S,
        trimmed_video_id: trimmed_video_id,
        startTime: req.body.startTime,
        duration: req.body.duration,
        ws: req.body.ws,
        user_id: req.body.user_id
      })
      res.json({
        message: 'video added to trim queue'
      });
		})
		.catch(error => {
			console.log(error); // an error occurred
			res.status(500).send(error);
		})
});
module.exports = router;