
const yargs = require('yargs');
const mqtt = require('mqtt');
const { exec } = require('child_process');

const codes = require('./config/config.js');

const argv = yargs
	.option('mqttHost', {
		description: 'Hostname of MQTT broker',
		alias: 'mqtt',
		type: 'string'
	})
	.option('codesend', {
		description: 'Path to codesend binary',
		type: 'string'
	})
	.help()
	.alias('help', 'h')
	.argv;



console.log('init script');
console.log(`args: ${argv}`);


// number of times you want to repeat commands
const commandRepeat = 2;

// queue of commands to run. we have to space out the commands or it'll try to execute commands over one another
let commandQueue = [];

// delay in ms between commands
const commandDelay = 500;

// location of your codesend binary
const codesend = (argv.codesend) ? argv.codesend : '/usr/src/app/etekcityZapTx';


// current state and brightness
// we're defaulting to off and 100% brightness
console.log('initializing state');
let current_state = {};
let current_brightness = {};
Object.keys(codes).forEach((device) => {
	current_state[device] = false;
	current_brightness[device] = 100;
});

console.log('creating and starting process queue');
const processQueue = () => {
	if (commandQueue.length > 0) {
		exec(commandQueue.shift(), (err, stdout, stderr) => {
			//console.log(`stdout: ${stdout}`);
			//console.log(`stderr: ${stderr}`);
		});
	}
	setTimeout(processQueue, commandDelay);
};
setTimeout(processQueue, commandDelay);

const sendCode = (command, device) => {
	for(let i=0; i < commandRepeat; i++) {
		let executable = codesend;
		if ('script' in codes[device]) {
			executable = codes[device]['script'];
		}
		console.log(`appending: ${executable} ${codes[device][command]}`);
		commandQueue.push(`${executable} ${codes[device][command]}`);
	}
};

const turnDeviceOn = (device) => {
	sendCode('on', device);
	client.publish(`${device}/getOn`, 'true');
	current_state[device] = true;
};

const turnDeviceOff = (device, brightness) => {
	sendCode('off', device);
	client.publish(`${device}/getOff`, 'false');
	current_state[device] = false;
	if (brightness) {
		current_brightness[device] = 0;
		client.publish(`${device}/getBrightness`, '0');
	}
};
// for sending the code, mqtt publish, state
const deviceBrightness = (device, brightness) => {
	sendCode(brightness.toString(), device);
	client.publish(`${device}/getBrightness`, brightness.toString());
	current_brightness[device] = brightness;
};

// for determining the rounded brightness and turning on/off the device
const changeBrightness = (device, brightness) => {
	let brightnessLevel = parseInt(brightness);

	// we have to round the brightness to the nearest 25% since that's what the controller supports
	// there might be a better math way to do this
	var roundedBrightness = Math.round(brightnessLevel / 100 * 4) / 4 * 100;
	// if we get a 0 brightness, set brightness to 0 and turn off the light
	if (roundedBrightness === 0) {
		turnDeviceOff(device, true);
	} else {
		// if the light is off, turn it on
		var delay = 0;
		if (!current_state[device]) {
			turnDeviceOn(device);
			delay = 1000;
		}
		// we can't execute the commands too fast, so delay the brightness change if we just turned them on
		setTimeout(() => {
			deviceBrightness(device, roundedBrightness)
		}, delay);
	}
}

//----------------
// MQTT Logic
//----------------

let mqttHost = (argv.mqttHost) ? argv.mqttHost : 'localhost';
console.log(`connecting to mqtt broker ${mqttHost}`);
const client = mqtt.connect(`mqtt://${mqttHost}`);

client.on('connect', () => {
	console.log('mqtt connected');
	Object.keys(codes).forEach((item) => {
		console.log(`subscribing to ${item} statuses`);
		client.publish(`${item}/connected`, 'true');
		client.subscribe(`${item}/setOn`);
		client.subscribe(`${item}/setBrightness`);
	});
});


client.on('message', (topic, message) => {
	topic = topic.toString();
	message = message.toString();

	console.log(`new message\ntopic: ${topic}\nmessage: ${message}`);

	// expect device/action, like backyard/setOn, and nothing else
	if (topic.split('/').length != 2) {
		return;
	}

	let [device, action] = topic.split('/');


	if (Object.keys(codes).includes(device)) {
		if (action === 'setOn') {
			if (message === 'true') {
				turnDeviceOn(device);
			} else {
				turnDeviceOff(device);
			}
		} else if (action === 'setBrightness') {
			changeBrightness(device, message);
		}
	}
});

