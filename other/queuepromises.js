const start = new Date();
for(let i = 0; i < parseInt(process.argv.slice(2)[0]); i++)
    Promise.resolve().then(() => {})

console.log(new Date() - start)