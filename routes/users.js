var Bcrypt = require('bcrypt'); // capitalize to help us distinguish its a library 
var Joi = require('joi');

exports.register = function (server, options, next) {
	// include routes
	server.route([
		{
			method: 'GET',
			path: '/users',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;

				db.collection('users').find().toArray(function(err, users) {
					if(err) {
						return reply('Internal MongoDB error', err);
					}
					reply(users);
				});
			}
		},
		{
			// creating a new user 
			method: 'POST',
			path: '/users',
			config: {
				handler: function(request, reply) {
					var db = request.server.plugins['hapi-mongodb'].db;
					var newUser = request.payload.user; 

					// https://www.npmjs.com/package/bcrypt
					Bcrypt.genSalt(10, function(err, salt) {
					    Bcrypt.hash(newUser.password, salt, function(err, hash) {
					    	newUser.password = hash;
								var uniqUserQuery = {
									$or: [
									{ username: newUser.username },
									{ email: newUser.email }	
								]};
									// if user already exists
								db.collection('users').count(uniqUserQuery, function(err, userExist) {
									if (userExist) {
										return reply("Error: Username already exist", err);
									}
									// otherwise, create the user
						      db.collection('users').insert(newUser, function(err, writeResult) {
							      if (err) {
							       return reply('Internal MongoDB Error', err);
							      } 
							      reply(writeResult);
									});
								});
					    });
					});
				},
				validate: {
					payload: {
						user: {
							username: Joi.string().min(3).max(20).required(),
							email: Joi.string().email().max(50).required(),
							password: Joi.string().min(5).max(20).required()
						}
					}
				}
			}
		}
	]);

	next();
}

// give this file some attributes
exports.register.attributes = {
	name: 'users-route',
	version: '0.0.1'
}