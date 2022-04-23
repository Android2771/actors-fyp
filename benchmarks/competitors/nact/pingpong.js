import nact from 'nact';
const { start, dispatch, stop, spawn, spawnStateless } = nact;

const N = process.argv.slice(2)[1] ? parseInt(process.argv.slice(2)[1]) : 100000000;   //Number of sends
const rounds = parseInt(process.argv.slice(2)[0]);    //Rounds of benchmark

const system = start();

const benchmarker = spawn(system, (state = {rounds}, message, ctx) => {
    switch(message.header){
        case "start":
            const start = new Date();
            const self = ctx.self;
            const ping = spawn(system, (state={benchmarker: self}, message, ctx) => {
                if(message.val-1 < 0){
                    dispatch(state.benchmarker, {header: "end"})
                }else{
                    dispatch(message.sender, {val: message.val-1, sender: ctx.self});
                }
            });
            //Can spawn stateless
            const pong = spawnStateless(system, (message, ctx) => {
                if(!(message.val-1 < 0))
                    dispatch(message.sender, {val: message.val-1, sender: ctx.self});
            });
            dispatch(ping, {val: N, sender: pong, benchmarker: ctx.self});
            return {...state, start, ping, pong}    //weird way of state management, have to return any state changes at the end rather than manipulate live
        case "end":
            stop(state.ping);
            stop(state.pong);

            const end = new Date();
            const time = end.getTime() - state.start.getTime()
            console.log(time);
            
            state.rounds--;
            if(state.rounds != 0)
                dispatch(ctx.self, {header: "start"})
    }
})

dispatch(benchmarker, {header: "start"})