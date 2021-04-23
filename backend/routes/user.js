const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

//return a user object with matching user_id and video_url
router.get('/', (req, res, _next) => {
	let client = req.DBclient
	client.connect()
		.then(() => {
			const users = req.DBclient.db('clipshare').collection('user');
			const query = { _id: req.query.user_id, video_url: req.query.url};
			users.findOne(query)
				.then(response => { //should send a 404 if no user with specified id was found
					res.json(response)
					//client.close();
				})
				.catch(error => {
					console.log('an error occured while finding the user')
					console.error(`Fatal error occurred: ${error}`)
					res.status(500).send(error);
					//client.close();
				});
		})
		.catch(error => {
			console.error(`Fatal error occurred: ${error}`)
			res.status(500).send(error);
			//client.close();
		});
});

//create a new user in the db and returns its id to the frontend
router.post('/', (req, res, _next) => {
	let user_id = uuidv4()
	req.DBclient.connect()
		.then(() => {
			const users = req.DBclient.db('clipshare').collection('user');
			users.insertOne({ _id: user_id })
				.then(response => {
					res.send(user_id)
					//req.DBclient.close();
				}).catch(error => {
					console.error(`Fatal error occurred: ${error}`)
					//req.DBclient.close();
				});
		})
		.catch(error => {
			console.error(`Fatal error occurred: ${error}`)
			res.status(500).send(error);
			//req.DBclient.close();
		});
});

router.post('/edit_active', (req, res, _next) => {
	req.DBclient.connect()
		.then(() => {
			const users = req.DBclient.db('clipshare').collection('user');
			users.updateOne({ _id: req.body.user_id},
				{
					$set: {
						'edit.active': req.body.active,
					},
					$currentDate: { lastModified: true }
				})
				.then(response => {
					res.json(response)
					//req.DBclient.close();
				})
				.catch(error => {
					console.error(`Fatal error occurred: ${error}`)
					res.status(500).send(error);
					//req.DBclient.close();
				});
		})
		.catch(error => {
			console.error(`Fatal error occurred: ${error}`)
			res.status(500).send(error);
		});
});

module.exports = router;