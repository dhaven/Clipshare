const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

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
	req.logger.log('info', `GET /user with id ${req.query.user_id} and video_url ${req.query.url}`);
	req.aws.dynamoDB_get_user(req.query.user_id)
		.then(data => {
			//user has not yet downloaded a video or he switched to a new video
			if(!data.Item || !data.Item.video_url || data.Item.video_url.S != req.query.url){
				res.json({
					user_id: req.query.user_id,
				})
			}else{ //return full user data so that user can resume where he left off
				res.json(data.Item)
			}
		})
		.catch(error => {
			req.logger.error(`An error occured while fetching user : ${req.query.user_id} with matching video_url : ${req.query.url} in dynamoDB`)
			req.logger.error(error);
			res.status(500).send(error);
		})
});

//return all of the user's data
router.get('/data', (req, res, _next) => {
	req.logger.log('info', `GET /user/data with id ${req.query.user_id}`);
	req.aws.dynamoDB_get_user(req.query.user_id)
		.then(data => {
			//user has not yet downloaded a video or he switched to a new video
			if(!data.Item || !data.Item.video_url){
				res.json({
					user_id: req.query.user_id,
				})
			}else{ //return full user data so that user can resume where he left off
				res.json(data.Item)
			}
		})
		.catch(error => {
			req.logger.error(`An error occured while fetching user data for user : ${req.query.user_id} in dynamoDB`)
			req.logger.error(error);
			res.status(500).send(error);
		})
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
	req.logger.info(` POST /user : Creating new user ${user_id}`);
	req.aws.dynamoDB_create_user(user_id)
		.then(data => {
			res.send(user_id)
		})
		.catch(error => {
			req.logger.error(`An error occured while creating user ${user_id} in dynamoDB`)
			req.logger.error(error);
			res.status(500).send(error);
		})
});

/*
	Updates editing progress to active or inactive
	
	Request post body: 
		active : Boolean //true if the user is currently editing the video. False otherwise
	returns: 
		user_object
*/
router.post('/edit_active', (req, res, _next) => {
	req.logger.info(` POST /user/edit_active ${req.body.user_id} is editing == ${req.body.active}`);
	req.aws.dynamoDB_update_edit(req.body.user_id, req.body.active)
		.then(data => {
			res.send(data)
		})
		.catch(error => {
			req.logger.error(`An error occured while setting edit.active to ${req.body.active} for user ${req.body.user_id}`)
			req.logger.error(error);
			res.status(500).send(error);
		})
});

module.exports = router;