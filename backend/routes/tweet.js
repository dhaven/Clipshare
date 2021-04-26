const express = require('express');
const router = express.Router();
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const config = require('../config');

/*
	Adds a new item to the tweet queue
	
	Request post body: 
		oauth_token : String
    oauth_token_secret: String
    message: String //The tweet to send
    user_id: String //The user that is sending the tweet
	returns: 
		message: 'video was added to the tweet queue'
*/
router.post('/', (req, res, _next) => {
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
			const token = {
        key: req.body.oauth_token,
        secret: req.body.oauth_token_secret,
      }
			req.queues.tweet.add('tweet_job',{
        token: token,
        video_id: data.Item.trimmed_video_id.S,
        ws: req.body.ws,
        message: req.body.message
      })
      res.json({
        message: 'video was added to the tweet queue'
      });
		}
	});
});

module.exports = router;