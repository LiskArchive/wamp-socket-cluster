# WAMP Socket Cluster

Merges RPC ideas of WAMP protocol with good performance of SocketCluster.

As [SocketCluster](http://socketcluster.io/#!/) is not compatible with [WAMP protocol](http://wamp-proto.org/) (as e.g. [AutobahnJS](https://github.com/crossbario/autobahn-js/)) this library provides the wrapper for both SocketClient (WAMPClient) and SocketServer (WAMPServer) and enables RPC web sockets usage.

## Benefits

- WAMP protocol style function calls (`socket.wampSend(...).then(...)`).
- Addresses the problem of response order in case of subscribing to an event after peer sends many individual requests.

## Installation

```
npm install wamp-socket-cluster
```

## Usage

- Initialize server side

```
const rpcEndpoints = { multiplyByTwo: num => num * 2 };
scServer.on('connection', socket => {
	wampServer.upgradeToWAMP(socket);
	wampServer.reassignEndpoints(rpcEndpoints);
});
```

- Initialize client side

```
const socket = scClient.connect(options);
wampClient.upgradeToWAMP(this.socket);
const randNumber =  Math.floor( Math.random() * 5 );
socket.wampSend('multiplyByTwo', 2)
      .then(result => console.log(`RPC result: ${randNumber} * 2 = ${result}`))
      .catch(err => console.error('RPC multiply by two error'));
```

## Example Usage

A simple but complete [example](https://github.com/LiskHQ/wamp-socket-cluster/tree/master/example) has been implemented. It includes socket cluster initialization, plus registration of RPC both at client and server side.

## Test

- `npm test`

## Authors

- Maciej Baj <maciej@lightcurve.io>

## License

Copyright (c) 2017 Lisk Foundation  

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the [GNU General Public License](https://github.com/LiskHQ/wamp-socket-cluster/tree/master/LICENSE) along with this program.  If not, see <http://www.gnu.org/licenses/>.
