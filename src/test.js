import {spawn, terminate, send} from './actors.js'

//Actor which replies
spawn('ping', {}, (state, message) => {
    console.log("ping!")
    send(message.sender, {sender: 'ping'})
})

spawn('pong', {i: 0}, (state, message) => {
    state.i++;
    setTimeout(() => {
        if(state.i < 5){
            console.log("pong!");
            send(message.sender, {sender: 'pong'})
        }else{            
            terminate('pong');  //self terminating actor! good or bad?
        }
    }, 2000)
})

send('ping', {sender: "pong"})