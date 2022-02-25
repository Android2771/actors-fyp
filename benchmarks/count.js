const counter = spawn({i: 0}, (state, message) => {
    if(message.header === "QUERY")
        send(message.from, state)
    else
        state.i++;
});

const producer = spawn({rounds, times: []}, (state, message) => {
    if(message.message === "start"){
        state.start = new Date();
        send(actors[0], {val: H});
    }else if(message.message === "end"){
        state.end = new Date()
        const time = state.end.getTime() - state.start.getTime()
        console.log(`Finished in ${time}ms`);
        state.times.push(time)
        state.rounds--;
        if(state.rounds === 0){
            const avg = state.times.reduce((a,b) => (a+b)) / state.times.length;
            console.log(`Average time: ${avg}ms`);
        }else{
            send(producer, {message: "start"});
        }
    }
});