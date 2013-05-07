proteus-monitor-statsd
====

This tool sends server statistics to statsd server.

### Install

    npm install -g proteus-monitor-statsd

### Usage

    proteus-monitor-statsd -h 111.222.333.444

### options

    -h,--host  Host of the statsd server
    -p,--port  Port number which statsd server listen
    -g,--group Group name of the server. default is `default`
    -n,--name  Server name. default is host name
    -6,--ipv6  Use IPV6 UDP socket

