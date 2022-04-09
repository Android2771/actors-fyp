process.env.UV_THREADPOOL_SIZE=64
let promisesQueued = false;

console.log('Queuing up promises...')
for(let i = 0; i < 14000000; i++){
    Promise.resolve().then(() => {
        if(!promisesQueued)
            console.log('Executing promises')
        promisesQueued = true
        for(let j = 0; j < 100000000; j++);
    })
}