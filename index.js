#!/usr/bin/env node

var program = require('commander');
var os = require('os');
var util = require('util');

var Watcher = require('./watcher');

program
.version('0.1.0')
.option('-6,--ipv6', 'Use IPV6 udp socket')
.option('-h,--host [host]', 'Host of the statsd server')
.option('-p,--port [port]', 'Port number of the statsd server', parseInt)
.option('-g,--group [group]', 'Group name of this host.')
.option('-n,--name [name]', 'Name of this host')
.option('--cache-dns [cacheDns]', 'Cache ip address of the host')
.parse(process.argv)
;

var watcher = new Watcher({
	host: program.host || '127.0.0.1',
	port: program.port || 8125,
	name: program.name || os.hostname(),
	group: program.group || 'default',
	ipv6: program.ipv6,
	cacheDns: program.cacheDns
});

watcher.start();

process.on('exit', function() {
	watcher.end();
});

