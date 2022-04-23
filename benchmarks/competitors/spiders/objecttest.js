import spiders from 'spiders.js'
class TestApp extends spiders.Application{
}

class TestActor extends spiders.Actor{
    test(object){
        console.log(object)
    }
}

const app = new TestApp()
const testRef = app.spawnActor(TestActor)
testRef.test({val: 'hi', x: 'yo'})  //objects can't be passed!