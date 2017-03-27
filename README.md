# wamp-socket-cluster
Merges ideas of WAMP protocol- introduce RPC with good performance of SocketCluster.

As [SocketCluster](http://socketcluster.io/#!/) is not compatible with [WAMP protocol](http://wamp-proto.org/) (as e.g [AutobahnJS](https://github.com/crossbario/autobahn-js/)) this library provides the wrapper for both SocketClient (WAMPClient) and SocketServer (WAMPServer) and enables RPC web sockets usage. Benefits:
- WAMP protocol style function calls (`socket.wampSend(...).then(...)`)
- addresses the problem of the response order in case of subscription to an event after peer sends many requests one by one.
### Usage
1. `npm install` / `yarn`fssfd
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
### Example usage
Simple but complete example has been implemented. It includes socket cluster initalization, registering RPC both at client and server side.

### !Achtung
It is important to start both `require(socketcluster-client)` and `require('socketcluster').SocketCluster` with `perMessageDeflate: false` option as in example
  
### Test
- `npm test`
