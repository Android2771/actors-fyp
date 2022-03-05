import actors from './actors.js';
const { init, spawn, spawnRemote, terminate, send } = actors

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    console.log("worker")
}else{
    const myWorker = new Worker('./index.js', {type: "module"});
    console.log("primary")
}