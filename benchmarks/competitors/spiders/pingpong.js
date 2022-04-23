import spiders from 'spiders.js'

const N = process.argv.slice(2)[1] ? parseInt(process.argv.slice(2)[1]) : 10000;   //Number of sends
const rounds = parseInt(process.argv.slice(2)[0]);    //Rounds of benchmark

class PingPongApp extends spiders.Application{
}

class PingActor extends spiders.Actor{
    ping(val, sender, benchmarker){
        if(benchmarker)
            this.benchmarker = benchmarker;
        if(val-1 < 0){
            this.benchmarker.benchmark('end')
        }else{
            sender.pong(val-1, this);
        }
    }
}

class PongActor extends spiders.Actor{
    pong(val, sender){
        if(!(val-1 < 0)){
            sender.ping(val-1, this);
        }       
    }
}

class BenchmarkerActor extends spiders.Actor{
    benchmark(header, pingRef, pongRef, n, rounds){
        switch(header){
            case "start":
                this.ping = pingRef;
                this.pong = pongRef
                this.n = n;
                this.rounds = rounds;

                this.start = new Date();
                pingRef.ping(n, pongRef, this);
            break;
            case "end":    
                this.end = new Date();
                const time = this.end.getTime() - this.start.getTime()
                console.log(time);
                
                this.rounds--;
                if(this.rounds != 0)
                    this.benchmark('start', this.ping, this.pong, this.n, this.rounds)
            break;
        }
    }
}

const app = new PingPongApp()
const benchmarkerRef = app.spawnActor(BenchmarkerActor)
const pingRef = app.spawnActor(PingActor);
const pongRef = app.spawnActor(PongActor);

benchmarkerRef.benchmark('start', pingRef, pongRef, N, rounds)