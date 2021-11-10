const {spawn, terminate, send} = require('../actors.js');

//Actor which replies
module.exports = {
    ping: (state, message) => {
        console.log("ping!")
        send(message.sender, {sender: ping})
    },

    pong: (state, message) => {
        state.i++;
        setTimeout(() => {
            if(state.i < 5){
                console.log("pong!");
                send(message.sender, {sender: pong})
            }else{            
                terminate(pong);  //self terminating actor! good or bad?
            }
        }, 2000)
    }
}