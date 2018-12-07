
// configuration

// codes pulled from the remote using RFSniffer
// we aren't actually using brightness up/down and just picking the closest quarter so we know the status
// 'script' is location of non codesend script. this is written a little backwards because it started as a just codesend thing
let codes = {
	'backyard': {
		'off': '2484227',
		'on': '2484225',
		'down': '2484233',
		'up': '2484231',
		'25': '2484237',
		'50': '2484239',
		'75': '2484243',
		'100': '2484245'
	},
	'switch1' : {
		'script': '/home/pi/light-server/etekcityZapTx',
		'off': '1 off',
		'on': '1 on'
	},
	'switch2' : {
		'script': '/home/pi/light-server/etekcityZapTx',
		'off': '2 off',
		'on': '2 on'
	},
	'switch3' : {
		'script': '/home/pi/light-server/etekcityZapTx',
		'off': '3 off',
		'on': '3 on'
	},
	'switch4' : {
		'script': '/home/pi/light-server/etekcityZapTx',
		'off': '4 off',
		'on': '4 on'
	},
	'switch5' : {
		'script': '/home/pi/light-server/etekcityZapTx',
		'off': '5 off',
		'on': '5 on'
	}
};

// location of your codesend binary
let codesend = '/home/pi/433Utils/RPi_utils/codesend';

// number of times you want to repeat commands
let commandRepeat = 2;

// queue of commands to run. we have to space out the commands or it'll try to execute commands over one another
var commandQueue = [];

// delay in ms between commands
let commandDelay = 500;



var http = require('http');
var url = require('url');

const { exec } = require('child_process');

// current state and brightness
// we're defaulting to off and 100% brightness
var current_state = {};
var current_brightness = {};
for (var device in codes) {
	current_state[device] = false;
	current_brightness[device] = 100;
}

var processQueue = function() {
	if (commandQueue.length > 0) {
		exec(commandQueue.shift(), (err, stdout, stderr) => {
			//console.log(`stdout: ${stdout}`);
			//console.log(`stderr: ${stderr}`);
		});
	}
	setTimeout(processQueue, commandDelay);
}
setTimeout(processQueue, commandDelay);

var sendCode = function (command, device) {
	for(var i=0; i < commandRepeat; i++) {
		var executable = codesend;
		if ('script' in codes[device]) {
			executable = codes[device]['script'];
		}
		console.log('appending: ' + executable + ' ' + codes[device][command]);
		commandQueue.push(executable + ' ' + codes[device][command]);
	}
};

http.createServer(function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	var q = url.parse(req.url, true).query;
	console.log(q);
	if (!q.device || q.device == '') {
		var device = 'backyard';
	} else {
		var device = q.device;
	}
	// check for status check
	switch(q.mode) {
		case 'status':
			res.end((current_state[device]) ? '1' : '0' );
			break;
		case 'brightness':
			res.end(current_brightness[device].toString());
			break;
		case 'switchOn':
			// got switch on. when changing brightness, it sends on also, so we need to ignore that to not get into overloading the commands
			if (!current_state[device]) {
				sendCode('on', device);
				current_state[device] = true;
			}
			res.end('1');
			break;
		case 'switchOff':
			sendCode('off', device);
			current_state[device] = false;
			res.end('1');
			break;
		case 'changeBrightness':
			var brightnessLevel = parseInt(q.level);
			// we have to round the brightness to the nearest 25% since that's what the controller supports
			// there might be a better math way to do this
			var roundedBrightness = Math.round(brightnessLevel / 100 *4) / 4 * 100;
			// if we get a 0 brightness, set brightness to 0 and turn off the light
			if (roundedBrightness === 0) {
				sendCode('off', device);
				current_state[device] = false;
				current_state[device] = 0;
			} else {
				// if the light is off, turn it on
				var delay = 0;
				if (!current_state[device]) {
					sendCode('on', device);
					current_state[device] = true;
					delay = 1000;
				}
				// we can't execute the commands too fast, so delay the brightness change if we just turned them on
				setTimeout(function() {
					sendCode(roundedBrightness.toString(), device);
					current_brightness[device] = roundedBrightness;
				}, delay);
				
			}
			res.end('1');
			break;
	}
			


	res.end('error');
}).listen(8080);

