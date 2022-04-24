import nact from 'nact';
const { start, dispatch, stop, spawn, spawnStateless } = nact;
import { v4 as uuidv4 } from 'uuid';

const N = process.argv.slice(2)[1] ? parseInt(process.argv.slice(2)[1]) : 1000000;  //Number of actors to spawn
const rounds = parseInt(process.argv.slice(2)[0]);

const system = start();

const benchmarker = spawn(system, (state={rounds}, message, ctx) => {
    switch(message.header){
        case "start":
            const start = new Date();
            for(let i = 0; i < N-1; i++)
                dispatch(spawnStateless(system, (message, ctx) => {
                        const sint = Math.sin(37.2);
                        const res = sint * sint;
                        stop(ctx.self)
                    }, uuidv4()), {});  //Can't spawn too many actors using their random naming scheme, had to use uuid instead
        
            //Final spawned actor replies to benchmarker
            dispatch(spawnStateless(system, (message, ctx) => {
                dispatch(message.sender, {header: "end"});
                stop(ctx.self);
            }, uuidv4()), {sender: ctx.self});
            return {...state, start}
        case "end":
            const end = new Date()
            const time = end.getTime() - state.start.getTime()
            console.log(time);
            
            if(--state.rounds != 0){
                dispatch(ctx.self, {header: "start"});
            }
            return state;
    }
});

dispatch(benchmarker, {header: "start"})