var Auth = require('./auth');
var Joi = require('joi');

exports.register = function (server, options, next) {
	// include routes
	server.route([
		{
			// List all the tweets 
			method: 'GET',
			path: '/tweets',
			handler: function(request, reply){
				var db = request.server.plugins['hapi-mongodb'].db;
        db.collection('tweets').find().toArray(function(err, result){
          if (err) {
						return reply('Internal MongoDB error', err);
					}
          reply(result);
        });
      }	
		},
		{
			// Create a new tweet (require user authentication) 
			method: 'POST',
			path: '/tweets',
			config: {
				handler: function(request, reply) {
					// Authenticate the user
					Auth.authenticated(request, function(result){
						if (result.authenticated) {
							// create the tweet
							var db = request.server.plugins['hapi-mongodb'].db; // load the mongodb
							var session = request.session.get('hapi_twitter_session'); // make sure user has an open session
							var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID; // link user to tweet with user id

							var tweet = {
								"message": request.payload.tweet.message, // read the payload
								"user_id": ObjectID(session.user_id) // link user to tweet with user id  
							}

				      db.collection('tweets').insert(tweet, function(err, writeResult) {
					      if (err) {
					       return reply('Internal MongoDB Error', err);
					      } 
					      reply(writeResult);
							});

						} else {
							reply(result.message)
						} 
					});
				},
				// Message cannot be more than 140 characters long - using Joi
				validate: { 
					payload: {
						tweet: {
							message: Joi.string().max(140).required(),
						}
					}
				}	 
			}	
		},
		{
			// Logging out / deleting session
			method: 'DELETE',
			path: '/tweets/{tweet_id}',
			handler: function(request, reply) {
        var id = encodeURIComponent(request.params.tweet_id);
        var db = request.server.plugins['hapi-mongodb'].db;
        var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

        db.collection('tweets').remove({ "_id" : ObjectID(id)}, function(err, writeResult){
          if (err) { return reply('Internal MongoDB error', err); }

          reply(writeResult);
        });
      }
		}
	]);

	next();
};

// give this file some attributes
exports.register.attributes = {
	name: 'tweets-route',
	version: '0.0.1'
}