import spiders from 'spiders.js'

const N = process.argv.slice(2)[1] ? parseInt(process.argv.slice(2)[1]) : 100;   //Number of sends

class FjCreateApp extends spiders.Application {
}

class FjCreateActor extends spiders.Actor {
    minimalWork() {
        const sint = Math.sin(37.2);
        const res = sint * sint;
    }
}

const app = new FjCreateApp()

for (let i = 0; i < N; i++) {
    const fjCreateActor = app.spawnActor(FjCreateActor)
    fjCreateActor.minimalWork()
}