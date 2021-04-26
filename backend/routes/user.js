const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const config = require('../config');

/*
	return a user object with matching user_id and video_url
	
	Request Query params: 
		user_id : String //the user's unique identifier
		url: String //the video url the user is watching
	returns: {
		user_id: String
	} || user_object
*/
router.get('/', (req, res, _next) => {
	const client = new DynamoDB({ region: config.dynamodb.region });
	var params = {
		Key: {
		 "user_id": {
			 S: req.query.user_id
			}
		}, 
		TableName: config.dynamodb.table
	 };
	 console.log("getting user info")
	 client.getItem(params, function(err, data) {
		 console.log("hello from callback")
		 if (err){
			console.log("there was some error")
			console.log(err, err.stack); // an error occurred
			res.status(500).send(error);
		 }
		 else if(!data.Item || !data.Item.video_url || data.Item.video_url.S != req.query.url){ //user has not yet downloaded a video or he switched to a new video
			console.log(data);           // successful response
			console.log("return user_id only")
			res.json({
				user_id: req.query.user_id,
			})
		 }else{
			console.log("return full user item")
			console.log(data);
			 res.json(data.Item)
		 }
	 });
});

/*
	create a new user in the db and returns its id to the frontend
	
	Request Query params: 
		user_id : String //the user's unique identifier
	returns: 
		user_id: String
*/
router.post('/', (req, res, _next) => {
	let user_id = uuidv4()
	const client = new DynamoDB({ region: config.dynamodb.region });
	var params = {
		Item: {
		 "user_id": {
			 S: user_id
			}, 
		}, 
		ReturnConsumedCapacity: "TOTAL", 
		TableName: config.dynamodb.table
	 };
	 client.putItem(params, function(err, data) {
		 if (err){
			 console.log(err, err.stack); // an error occurred
			 res.status(500).send(error);
		 }else{
			console.log(data);           // successful response
			res.send(user_id)
		 } 
	 });
});

/*
	Updates editing progress to active or inactive
	
	Request post body: 
		active : Boolean //true if the user is currently editing the video. False otherwise
	returns: 
		user_object
*/
router.post('/edit_active', (req, res, _next) => {
	const client = new DynamoDB({ region: config.dynamodb.region });
	var params = {
		Key: {
		 "user_id": {
			 S: req.body.user_id
			}
		},
		UpdateExpression: "SET edit.active = :active",
		ExpressionAttributeValues: {
			':active': {
				BOOL: req.body.active,
			}
		},
		ReturnConsumedCapacity: "TOTAL", 
		TableName: config.dynamodb.table
	 };
	client.updateItem(params, function(err, data) {
		if (err){
			console.log(err, err.stack); // an error occurred
			res.status(500).send(err);
		}else{
			console.log(data);           // successful response
			res.send(data)
		} 
	});
});

module.exports = router;