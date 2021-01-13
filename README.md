# 433 Mhz Dimmable LED MQTT (Homebridge) Controller

This is for an outdoor string light LED controller, but I'm sure others exist. The remote is running on 433MHz and supports brightness levels. The remote has the buttons on/off/brightness up/brightness down/25%/50%/75%/100%. This only uses the on/off and specific brightness levels.

## Requirements

* [433utils](https://github.com/ninjablocks/433Utils)
* wiringPi
* 433Mhz receiver and transmitter
* nodejs
* MQTT broker

## Setup

1. Follow the instructions for setting up the 433Mhz modules. Receiver goes to WiringPi's 2 and sender goes to wiringPis 0. Use 5V & GND from RPi. For the receiver, use the pin closest to ground.
1. Collect the codes from RFSniffer in 433Utils. Put those codes into `config/config.js`. They'll just look something like `2484245`
* Run using `nodejs mqtt.js --codesend /path/to/codesend --mqttHost mqtt-broker.local` editing the options to point to your codesend binary and your MQTT broker

## Docker

1. Clone this repo
1. Follow the steps above to collect your 433Mhz code (TODO: docker image for code sniffer)
1. Edit `config/config.js` with these values
1. Copy `.env-sample` to `.env` and edit `MQTTHOST` value
1. `docker-compose up -d`

## Homebridge Setup

Install [homebridge-mqttthing](https://github.com/arachnetech/homebridge-mqttthing)

Add these accessories in `config.json`, editing `url` to point to your MQTT broker. Change the names of the light as desired. 

```
{
	"accessory": "mqttthing",
	"type": "lightbulb",
	"name": "Backyard Lights",
	"url": "mqtt://o.xrho.com",
	"topics": {
		"getOn": "backyard/getOn",
		"setOn": "backyard/setOn",
		"getBrightness": "backyard/getBrightness",
		"setBrightness": "backyard/setBrightness"
	}
},
```
