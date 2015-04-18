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
    	// Reading a single tweet        
      method: 'GET',
      path: '/tweets/{tweet_id}',
      handler: function(request, reply) {
        var id = encodeURIComponent(request.params.tweet_id);
        var db = request.server.plugins['hapi-mongodb'].db;
        var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
        db.collection('tweets').findOne({ "_id" : ObjectID(id)}, function(err, tweet){
          if (err) { 
          	return reply('Internal MongoDB error', err); 
          }
          reply(tweet);
        })
      }
    },
		{
			// Delete a tweet
			method: 'DELETE',
			path: '/tweets/{tweet_id}',
			handler: function(request, reply) {
        var id = encodeURIComponent(request.params.tweet_id);
        var db = request.server.plugins['hapi-mongodb'].db;
        var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

        db.collection('tweets').remove({ "_id" : ObjectID(id)}, function(err, writeResult){
          if (err) { 
          	return reply('Internal MongoDB error', err); 
          }
          reply(writeResult);
        });
      }
		},
		{
		  // Retrieve all tweets by a specific user
		  method: 'GET',
		  path: '/users/{username}/tweets',
		  handler: function(request, reply) {
		    var db = request.server.plugins['hapi-mongodb'].db;
		    var username = encodeURIComponent(request.params.username);

		    db.collection('users').findOne({ "username": username }, function(err, user) {
		      if (err) { return reply('Internal MongoDB error', err); }

		      db.collection('tweets').find({ "user_id": user._id }).toArray(function(err, tweets) {
		        if (err) { return reply('Internal MongoDB error', err); }

		        reply(tweets);
		      });
		    })
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