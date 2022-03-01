# JavaScript Framework for Actor-Based Programming
The project aims to engineer a JavaScript framework for building actor-based systems which will  use  the  web  as  its  global  distributed  platform.   The  performance  and  usability  of  theartifact will then be analysed through empirical measurement.

## Features
* Allow developer to create, terminate and send messages to actors
* Handle distributed communication between actors
* Location transparency, allowing the developer to treat remote actors in the same way as local actors
* Remote spawning allowing developers to create coordinator/worker nodes

## Limitations
* The number of nodes are fixed where each node has the addresses of other nodes
* References to actors can either be communicated as an object or retrieved through remote spawning

## Example
### Starting the network
```bash
cd src
npm i
tsc
node network.js <NUMBER_OF_NODES>
```
### Connecting to the network using the actor framework
On one node, use the following code to establish the first connected node
```js
import actors from './src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors
init('ws://localhost:8080')
```
### Sending a message to a remotely spawned node
On another node, use the following code to establish the second connection, and remotely spawn and send a message to the first connected node
```js
import actors from './src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors;
init('ws://localhost:8080').then(async data => {
    const actor = await spawnRemote(1, {}, (state, message) => {console.log(message.message)}, 5000)
    send(actor, {message: "test"})
});
```
Alternatively, the code above can be found inside the `test/pingpong` folder.
```bash
cd test/pingpong
node ping.js &
node pong.js &
```