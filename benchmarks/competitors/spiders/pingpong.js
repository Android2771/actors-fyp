/**
 * Created by flo on 06/03/2017.
 * Modified by Android2771 on 25/04/2022
 */
import spiders from 'spiders.js'
 class PingPongApp extends spiders.Application{
 }
 var app = new PingPongApp()
 class PingActor extends spiders.Actor{
     start(pongRef){
        this.pings = 0;
        this.start = new Date();
        pongRef.ping(this)
     }
 
     pong(pongRef){
         if(++this.pings === 5000000)
            console.log(new Date() - this.start)
         pongRef.ping(this)
     }
 }
 class PongActor extends spiders.Actor{
     ping(pingRef){
         pingRef.pong(this)
     }
 }
 var pongRef = app.spawnActor(PongActor)
 var pingRef = app.spawnActor(PingActor)
 pingRef.start(pongRef)