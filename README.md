# 433 MHz Outlet (Etekcity) MQTT (Homebridge) Controller

This is to control Etekcity 433MHz outlets. 

## Requirements

* [433utils](https://github.com/ninjablocks/433Utils)
* wiringPi
* 433Mhz receiver and transmitter
* nodejs
* MQTT broker

## Setting up 433MHz sniffer

1. Follow the instructions for setting up the 433Mhz modules. Receiver goes to WiringPi's 2 and sender goes to wiringPis 0. Use 5V & GND from RPi. For the receiver, use the pin closest to ground.
1. Clone and build [433utils](https://github.com/ninjablocks/433Utils)
1. Optionally via docker: `docker-compose up sniffer`

## etekcityZapTx.c

`etekcityZapTx.c` was pulled from http://shaunsbennett.com/piblog/?p=142

He just has it listed as copyright, nothing open source, so I'm not going to list it as that, but I did have to modify it to get it to work


In it, he uses the sizes at 8bit x 12 bit x 4 bit. It actually is 10bit x 10 bit x 4 bit.

The first 10 bits are your specific code. 

The next 10 are for the number of switch (this is consistent)

The 4 are for on/off. Also consistent

You can figure your first 10 bit code with 433Utils and RFSniffer

1. Take the decimal number they give you
1. Convert it to binary
1. Pull off the last 14 bits
1. Convert the remaining back to decimal
1. This is your `ADDR_PREAMBLE` and first parameter to the `etekcityZapTx`

## Defining the codes array

1. Determine the `ADDR_PREAMBLE` from above
1. Edit `codes` object in `config.js` with this and labeling the switches

```javascript
const codes = {
	'SWITCH_LABEL' : {
		'off': 'ADDR_PREAMBLE SWITCH_NUMBER off',
		'on': 'ADDR_PREAMBLE SWITCH_NUMBER on'
	}
}
```
## Docker

1. Save `config/config.js` with these values
1. Copy `.env-sample` to `.env` and edit `MQTTHOST` value
1. `docker-compose up -d server`

## Homebridge Setup

Install [homebridge-mqttthing](https://github.com/arachnetech/homebridge-mqttthing)

Add these accessories in `config.json`, editing `url` to point to your MQTT broker. Change the names of the outlet as desired. 

```
{
	"accessory": "mqttthing",
	"type": "outlet",
	"name": "Outlet 1",
	"url": "mqtt://o.xrho.com",
	"topics": {
		"getOn": "switch1/getOn",
		"setOn": "switch1/setOn"
	}
}
```
