
// codes pulled from the remote using RFSniffer
// we aren't actually using brightness up/down and just picking the closest quarter so we know the status
// 'script' is location of non codesend script. this is written a little backwards because it started as a just codesend thing
const codes = {
	'backyard': {
		'off': '2484227',
		'on': '2484225',
		'down': '2484233',
		'up': '2484231',
		'25': '2484237',
		'50': '2484239',
		'75': '2484243',
		'100': '2484245'
	}
};


module.exports = codes;

