# What this is for

This is for an outdoor string light LED controller. The remote is running on 433MHz and supports brightness levels. The remote has the buttons on/off/brightness up/brightness down/25%/50%/75%/100%. This only uses the on/off and specific brightness levels.

# Requirements

* [433utils](https://github.com/ninjablocks/433Utils)
* wiringPi
* 433Mhz receiver and transmitter
* nodejs

# Setup

1. Follow the instructions for setting up the 433Mhz modules. Receiver goes to WiringPi's 2 and sender goes to wiringPis 0. Use 5V & GND from RPi. For the receiver, use the pin closest to ground.
1. Collect the codes from RFSniffer in 433Utils. Put those codes into `server.js`. They'll just look something like `2484245`
* Define the location of `codesend` binary from 433Utils in `server.js`
* Run using `nodejs server.js`

# Homebridge Setup

Install `homebridge-http` using npm then edit `config.json` to include the location of your pi webserver.

```
"accessories": [
		{
				"accessory": "Http",
				"name": "Backyard Lights",
				"switchHandling": "realtime",
				"http_method": "GET",
				"on_url": "http://192.168.1.27:8080/?mode=switchOn",
				"off_url": "http://192.168.1.27:8080/?mode=switchOff",
				"status_url": "http://192.168.1.27:8080/?mode=status",
				"service": "Light",
				"brightnessHandling": "yes",
				"brightness_url": "http://192.168.1.27:8080/?mode=changeBrightness&level=%b",
				"brightnesslvl_url": "http://192.168.1.27:8080/?mode=brightness",
				"sendImmediately": "",
				"username": "",
				"password": ""
		}
]
```

