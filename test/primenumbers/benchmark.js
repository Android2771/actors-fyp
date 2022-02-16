const args = process.argv.slice(2);
const from = parseInt(args[0])
const to = parseInt(args[1])

const computePrimeNumbers = (from, to) => {
    primeNumbers = []

    for(let i = from; i < to; i++){
        if(i < 2)
            continue

        let isPrime = true;
        for (let j = 2; j < i; j++) {
            if (i % j === 0) {
                isPrime = false;
                break;
            }
        }
    
        if(isPrime)
            primeNumbers.push(i)        
    }

    return primeNumbers    
}

console.log(computePrimeNumbers(from, to))