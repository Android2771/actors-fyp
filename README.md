# JavaScript Framework for Actor-Based Programming
The project aims to engineer a JavaScript framework for building actor-based systems whichwill  use  the  web  as  its  global  distributed  platform.   The  performance  and  usability  of  the artifact will then be analysed through empirical measurement.

## Features
* Allow developer to create, terminate and send messages to actors
* Handle distributed communication between actors
* Location transparency, allowing the developer to treat remote actors in the same way as local actors
* Remote spawning allowing developers to create worker/slave nodes

## Limitations
* The number of nodes are fixed where each node has the addresses of other nodes
* References to actors can either be communicated as an object or retrieved through remote spawning