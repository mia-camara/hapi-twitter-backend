var Bcrypt = require('bcrypt'); 
var Auth = require('./auth');

exports.register = function (server, options, next) {
	// include routes
	server.route([
		{
			// creating a new session 
			method: 'POST',
			path: '/sessions',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db; // load the mongodb
				var user = request.payload.user; // read the payload

				// Find if the user exists
				db.collection('users').findOne({"username": user.username}, function(err, userMongo) {
					if (err) {
						return reply('Internal MongoDB error', err);
					}
						if (userMongo === null) {
						return reply({"message": "User doesn't exist"});
					}

					// Encrypt password 
					Bcrypt.compare(user.password, userMongo.password, function(err, matched) {
						if (matched) {
							// If password matches, authenticate user and add to cookie
							function randomKeyGenerator() {
							    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
							  }
							   
							  // Generate a random key
							  var randomkey = (randomKeyGenerator() + randomKeyGenerator() + "-" + randomKeyGenerator() + "-4" + randomKeyGenerator().substr(0,3) + "-" + randomKeyGenerator() + "-" + randomKeyGenerator() + randomKeyGenerator() + randomKeyGenerator()).toLowerCase();

							  var newSession = {
							  	"session_id": randomkey,
							  	"user_id": userMongo._id
							  };

							  db.collection('sessions').insert(newSession, function(err, writeResult) {
							  	if (err) {
							  		return reply('Internal MongoDB Error', err);
							  	}

							  	// Store the session information in the Browser Cookie using Yar
							  	request.session.set('hapi_twitter_session', {
							  		"session_key": randomkey,
							  		"user_id": userMongo._id
							  	});
							  	return reply(writeResult);
							  });

						} else {
							reply({"message": "Not authorized"})
						}
					});
				});	
			} 
		},
		{
			method: 'GET',
			path: '/authenticated',
			handler: function(request, reply){
				Auth.authenticated(request, function(result){
					reply(result);
				});
			}
		},
		{
			// Logging out / deleting session
			method: 'DELETE',
			path: '/sessions',
			handler: function(request, reply) {
				// obtain the session from the browser
				var session = request.session.get('hapi_twitter_session');
				// initial db
				var db = request.server.plugins['hapi-mongodb'].db;

				if (!session) {
					return reply({"message": "Already logged out"});
				}

        // search for the same session in the db
        // remove that session in the db
        db.collection('sessions').remove({ "session_id": session.session_key }, function(err, writeResult){
          if (err) { return reply('Internal MongoDB error', err); }

          reply(writeResult);
        });
			},
		}
	]);

	next();
};

// give this file some attributes
exports.register.attributes = {
	name: 'sessions-route',
	version: '0.0.1'
}