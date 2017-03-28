# wamp-socket-cluster
Merges ideas of WAMP protocol- introduce RPC with good performance of SocketCluster.

As [SocketCluster](http://socketcluster.io/#!/) is not compatible with [WAMP protocol](http://wamp-proto.org/) (as e.g [AutobahnJS](https://github.com/crossbario/autobahn-js/)) this library provides the wrapper for both SocketClient (WAMPClient) and SocketServer (WAMPServer) and enables RPC web sockets usage. Benefits:
- WAMP protocol style function calls (`socket.wampSend(...).then(...)`)
- addresses the problem of the response order in case of subscription to an event after peer sends many requests one by one.
## Usage
1. `npm install` / `yarn`
2. Minimal setup:
- initialize server side
```	
const rpcEndpoints = { multiplyByTwo: num => num * 2 };
scServer.on('connection', socket => {
  wampServer.upgradeToWAMP(socket);
  wampServer.reassignEndpoints(rpcEndpoints);
});
```
- initialize client side
```
const socket = scClient.connect(options);
wampClient.upgradeToWAMP(this.socket);
const randNumber =  Math.floor( Math.random() * 5 );
socket.wampSend('multiplyByTwo', 2)
			.then(result => console.log(`RPC result: ${randNumber} * 2 = ${result}`))
			.catch(err => console.error('RPC multiply by two error'));
```
## Example usage
Simple but complete example has been implemented. It includes socket cluster initalization, registering RPC both at client and server side.

## Test
- `npm test`

## Authors
- Maciej Baj <maciej@lightcurve.io>

## License

The MIT License (MIT)

Copyright (c) 2016-2017 Lisk Foundation  
Copyright (c) 2014-2015 Crypti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:  

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.