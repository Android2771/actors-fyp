const args = process.argv.slice(2);
const upTo = parseInt(args[0])
const { performance } = require('perf_hooks');

primeNumbers = []
const startTime = performance.now()

for(let i = 2; i < upTo; i++){
    let isPrime = true;
    for (let j = 2; j < i; j++) {
        if (i % j === 0) {
            isPrime = false;
            break;
        }
    }

    if(isPrime){
        primeNumbers.push(i)
    }
}

const endTime = performance.now()

console.log(`Process time: ${endTime - startTime} milliseconds`)