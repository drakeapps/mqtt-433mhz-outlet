
// configuration

// codes pulled from the remote using RFSniffer
// we aren't actually using brightness up/down and just picking the closest quarter so we know the status
let codes = {
	'off': '2484227',
	'on': '2484225',
	'down': '2484233',
	'up': '2484231',
	'25': '2484237',
	'50': '2484239',
	'75': '2484243',
	'100': '2484245'
};

// location of your codesend binary
let codesend = '/home/pi/433Utils/RPi_utils/codesend';

// number of times you want to repeat commands
let commandRepeat = 1;




var http = require('http');
var url = require('url');

const { exec } = require('child_process');

// current state and brightness
// we're defaulting to off and 100% brightness
var current_state = false;
var current_brightness = 100;

var sendCode = function (command) {
	for(var i=0; i < commandRepeat; i++) {
		console.log(codesend + ' ' + codes[command]);
		exec(codesend + ' ' + codes[command], (err, stdout, stderr) => {
			//console.log(`stdout: ${stdout}`);
			//console.log(`stderr: ${stderr}`);
		});
	}
};

http.createServer(function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	var q = url.parse(req.url, true).query;
	console.log(q);
	// check for status check
	switch(q.mode) {
		case 'status':
			res.end((current_state) ? '1' : '0' );
			break;
		case 'brightness':
			res.end(current_brightness.toString());
			break;
		case 'switchOn':
			// got switch on. when changing brightness, it sends on also, so we need to ignore that to not get into overloading the commands
			if (!current_state) {
				sendCode('on');
				current_state = true;
			}
			res.end('1');
			break;
		case 'switchOff':
			sendCode('off');
			current_state = false;
			res.end('1');
			break;
		case 'changeBrightness':
			var brightnessLevel = parseInt(q.level);
			// we have to round the brightness to the nearest 25% since that's what the controller supports
			// there might be a better math way to do this
			var roundedBrightness = Math.round(brightnessLevel / 100 *4) / 4 * 100;
			// if we get a 0 brightness, set brightness to 0 and turn off the light
			if (roundedBrightness === 0) {
				sendCode('off');
				current_state = false;
				current_brightness = 0;
			} else {
				// if the light is off, turn it on
				var delay = 0;
				if (!current_state) {
					sendCode('on');
					current_state = true;
					delay = 1000;
				}
				// we can't execute the commands too fast, so delay the brightness change if we just turned them on
				setTimeout(function() {
					sendCode(roundedBrightness.toString());
					current_brightness = roundedBrightness;
				}, delay);
				
			}
			res.end('1');
			break;
	}
			


	res.end('error');
}).listen(8080);

