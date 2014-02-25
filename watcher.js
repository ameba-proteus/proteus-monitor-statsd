
var dgram = require('dgram');
var nodestat = require('node-stat');
var StatsD = require('node-statsd').StatsD;
var interval = 10000;
var nexttime = Date.now();
var firsttime = true;

/**
 * Watcher
 * @param option.host host of the statsd server.
 * @param option.port port number which connect to.
 * @param option.group group name of the server
 * @param option.name name of the host.
 */
function Watcher(option) {

	this.client = new StatsD({
		host: option.host,
		port: option.port,
		prefix: 'server.' + option.group + '.' + option.name + '.',
		cacheDns: option.cacheDns
	});
	
	// use ipv6 socket
	if (option.ipv6) {
		this.client.socket = dgram.createSocket('udp6');
		this.client.socket.unref();
	}

	/*
	this.client = {
		gauge: function(name, value) {
			console.log(name,'=',value);
		}
	};
	*/

	this.interval = option.interval || 10000;

}

Watcher.prototype = {

	start: function() {
		this.startTime = Date.now();
		this.nextTime = Date.now() + this.interval;
		this.firstTime = true;
		this.retrieve();
	},

	retrieve: function() {
		var self = this;
		nodestat.get('mem', 'stat', 'load', 'net', 'disk', function(err, data) {

			// skip first time
			if (self.firstTime) {

				self.firstTime = false;

			} else {

				var client = self.client;

				// send stats to the statsd
				var stat = data.stat;
				// user,nice,system,iowait,idle,irq,softirq,steal,guest,guest_nice
				var cpu = stat.cpu.total;
				// interrupt, contextsw
				var sys = stat.system;
				// running, blocked
				var proc = stat.process;
				// load [1m,5m,15m]
				var load = data.load;
				// net
				var net = data.net;
				// disk
				var disk = data.disk;
				var name, value;
				// mem
				var mem = data.mem;

				// send cpu stats
				client.gauge('cpu.user', cpu.user);
				client.gauge('cpu.nice', cpu.nice);
				client.gauge('cpu.system', cpu.system);
				client.gauge('cpu.iowait', cpu.iowait);
				client.gauge('cpu.idle', cpu.idle);
				client.gauge('cpu.irq', cpu.irq);
				client.gauge('cpu.softirq', cpu.softirq);
				client.gauge('cpu.steal', cpu.steal);

				// send mem stats
				client.gauge('mem.used', mem.used);
				client.gauge('mem.total', mem.total);
				client.gauge('mem.free', mem.free);
				client.gauge('mem.buffer', mem.buffer);
				client.gauge('mem.cached', mem.cached);

				// send process
				client.gauge('process.running', proc.running);
				client.gauge('process.blocked', proc.blocked);

				// irq
				client.gauge('system.interrupt', sys.interrupt);
				client.gauge('system.contextsw', sys.contextsw);

				// send load average
				client.gauge('load.1m', Math.round(load[0]*100)/100);
				client.gauge('load.5m', Math.round(load[1]*100)/100);
				client.gauge('load.15m', Math.round(load[2]*100)/100);

				// send networks
				for (name in net) {
					if (name === 'total') {
						continue;
					}
					value = net[name];
					client.gauge(['net',name,'receive'].join('.'), value.receive);
					client.gauge(['net',name,'send'].join('.'), value.send);
				}

				// send disks
				for (name in disk) {
					value = disk[name];
					client.gauge(['disk',name,'read'].join('.'), value.read.sector);
					client.gauge(['disk',name,'write'].join('.'), value.write.sector);
					client.gauge(['disk',name,'usage','used'].join('.'),
											 value.usage.used);
					client.gauge(['disk',name,'usage','available'].join('.'),
											 value.usage.available);
				}
			}

			// reserve next timeout
			var now = Date.now();
			while (self.nextTime < now) {
				self.nextTime += self.interval;
			}

			// calculate wait time
			var wait = self.nextTime - Date.now();

			// hook next retrieval
			self.timerId = setTimeout(self.retrieve.bind(self), wait);

		});
	},

	end: function() {
		if (this.timerId) {
			clearTimeout(this.timerId);
		}
	}

};

module.exports = Watcher;
