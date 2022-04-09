let promisesQueued = false;

console.log('Queuing up promises...')
const start = new Date();
for(let i = 0; i < 14000000; i++){
    Promise.resolve().then(() => {
        if(!promisesQueued)
            console.log('Executing promises')
        promisesQueued = true
    })

    if(i === 14000000 - 1)
        console.log(new Date() - start)
}