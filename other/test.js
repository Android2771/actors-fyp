const recursive = () => {
    for(let i = 0; i < 1000000; i++){
        Promise.resolve().then(() => {
            recursive();
        })
    }
}

recursive();

