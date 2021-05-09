const { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

/*
* Class representing AWS.
* Wraps common API endpoint in simple to use functions.
* returns promises to be consumed by caller entity
*/
class AWS {
	//Initialize the clients
	constructor(config){
		this.config = config
    this.dynamoDBClient = new DynamoDBClient({ region: config.dynamodb.region});
		this.S3Client = new S3Client({ region: config.s3.region });
	}

	/*
		Pushes an object in local filesystem to S3
	*/
	s3_put_object(filename, src_filepath, origin_folder){
		const fileStream = fs.createReadStream(src_filepath);
		const uploadParams = {
			Bucket: this.config.s3.bucket,
			Key: origin_folder + '/' + filename,
			Body: fileStream,
		};
		return this.S3Client.send(new PutObjectCommand(uploadParams))
	}

	/*
		Downloads a file from S3 from either "raw" or "edit" folders
	*/
	s3_get_object(filename, dest_filepath, origin_folder){
		const downloadParams = {
			Bucket: this.config.s3.bucket,
			Key: origin_folder + '/' + filename,
		};
		let promise = new Promise((resolve,reject) => {
			this.S3Client.send(new GetObjectCommand(downloadParams))
			.then((data) => {
				const fileStream = fs.createWriteStream(dest_filepath);
				data.Body.on("error", error => {
					console.log(error)
					reject(error)
				});
				data.Body.pipe(fileStream);
				data.Body.on("close", () => {
					console.log('video finished downloading')
					fileStream.end()
				})
				fileStream.on('close', () => {
					resolve(dest_filepath)
				})
			})
		})
		return promise
	}

	/*
		Adds a new user to the DB
	*/
	dynamoDB_create_user(user_id){
		var params = {
			Item: {
			 "user_id": {
				 S: user_id
				}, 
			}, 
			ReturnConsumedCapacity: "TOTAL", 
			TableName: this.config.dynamodb.table
		 };
		 return this.dynamoDBClient.send(new PutItemCommand(params))
	}

	/*
		Get all the data from a user
	*/
	dynamoDB_get_user(user_id){
		var params = {
			Key: {
			 "user_id": {
				 S: user_id
				}
			}, 
			TableName: this.config.dynamodb.table
		};
		return this.dynamoDBClient.send(new GetItemCommand(params))
	}

	/*
		Update weither this user is actively editing or submitting
	*/
	dynamoDB_update_edit(user_id, active){
		var params = {
			Key: {
			 "user_id": {
				 S: user_id
				}
			},
			UpdateExpression: "SET edit.active = :active",
			ExpressionAttributeValues: {
				':active': {
					BOOL: active,
				}
			},
			ReturnConsumedCapacity: "TOTAL", 
			TableName: this.config.dynamodb.table
		 };
		 return this.dynamoDBClient.send(new UpdateItemCommand(params))
	}

	/*
		Update user with info from recently downloaded video
		use "put" method to override any previous data from this user
	*/
	dynamoDB_update_video(user_id, video_id, video_url){
		var params = { 
			Item: {
				"user_id": {
					S: user_id
				 },
			 	"video_id": {
				 	S: video_id
				}, 
			 "video_url": {
				 S: video_url
				},
			 "edit": {
				 M: {
					 "active": {
						 BOOL: true
					 }
				 }
			 }
			},
			TableName: this.config.dynamodb.table
		 };
		 return this.dynamoDBClient.send(new PutItemCommand(params))
	}

	/*
		Update user with info from recently trimmed video
	*/
	dynamoDB_update_trim(user_id, trimmed_video_id){
		var params = {
			Key: {
			"user_id": {
				S: user_id
				}
			},
			ExpressionAttributeValues: {
				":trim_vid": {
					S: trimmed_video_id
				}, 
				":edit": {
					M: {
						"active": {
							BOOL: false
						}
					}
				}
			}, 
			ReturnConsumedCapacity: "TOTAL", 
			TableName: this.config.dynamodb.table,
			UpdateExpression: "SET edit = :edit, trimmed_video_id = :trim_vid"
		};
		return this.dynamoDBClient.send(new UpdateItemCommand(params))
	}

	dynamoDB_put_tweet(user_id, tweet_url){
		var params = {
			Key: {
			"user_id": {
				S: user_id
				}
			},
			ExpressionAttributeValues: {
				":tweet_url": {
					S: tweet_url
				}
			}, 
			ReturnConsumedCapacity: "TOTAL", 
			TableName: this.config.dynamodb.table,
			UpdateExpression: "SET tweet_url = :tweet_url"
		};
		return this.dynamoDBClient.send(new UpdateItemCommand(params))
	}
}

module.exports = AWS;