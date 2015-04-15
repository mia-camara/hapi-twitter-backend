var Hapi = require('hapi');
var server = new Hapi.Server();

server.connection({
	host: '0.0.0.0',
	port: process.env.PORT || 3000, // process.env.PORT is an environment variable prepared by Heroku Deployment
	routes: {
		cors: true // cross-origin resource sharing 
	}
});

// this is where you include your dependencies 
var plugins = [
	{ register: require('./routes/users.js') },
	{ // give options so it knows which database your'e referring to
		register: require('hapi-mongodb'), 
		options: {
			"url": "mongodb://127.0.0.1:27017/hapi-twitter",
			"settings": {
				"db": {
					"native_parser": false
				}
			}
		}
	} 
];

server.register(plugins, function(err) {
	if (err) { throw err; }

	server.start(function() {
		console.log('info', 'Server running at: ' + server.info.uri);
	});
});
