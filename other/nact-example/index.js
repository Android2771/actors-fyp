const { start, dispatch, stop, spawnStateless, spawn, query } = require('nact');
const system = start();

//STATELESS ACTORS
const greeter = spawnStateless(
    system, // parent
    (msg, ctx) => console.log(`Hello ${msg.name}`), // function
    'greeter' // name
  );

dispatch(greeter, { name: 'Erlich Bachman' });    //send message

//STATEFUL ACTORS. The return value is used as the next state
const statefulGreeter = spawn(
    system, 
    (state = {}, msg, ctx) => {
        const hasPreviouslyGreetedMe = state[msg.name] !== undefined;
        if(hasPreviouslyGreetedMe) {
            console.log(`Hello again ${msg.name}.`);  
            return state;  
        } else {
            console.log(`Good to meet you, ${msg.name}. I am the ${ctx.name} service!`);

        return { ...state, [msg.name]: true };
        }
    },
    'stateful-greeter'
);

dispatch(statefulGreeter, { name: 'A'});
dispatch(statefulGreeter, { name: 'A'});

//ACTOR COMMUNICATION
const delay = (time) => new Promise((res) => setTimeout(res, time));
const ping = spawnStateless(system, async (msg, ctx) =>  {
    console.log(msg.value);
    await delay(500);
    dispatch(msg.sender, { value: ctx.name, sender: ctx.self });
  }, 'ping');
  
const pong = spawnStateless(system, (msg, ctx) =>  {
    console.log(msg.value);
    dispatch(msg.sender, { value: ctx.name, sender: ctx.self });
}, 'pong');

const pingLimited = spawn(system, async (state = {i: 0}, msg, ctx) =>  {
    console.log(msg.value);
    await delay(500);
    if(state.i < 5){
        dispatch(msg.sender, { value: ctx.name, sender: ctx.self });
        state.i++;
        return state;
    }else{
        return;
    }
  }, 'ping-limited');
  
// dispatch(ping, { value: 'begin', sender: pong });
dispatch(pingLimited, { value: 'begin', sender: pong });

//QUERYING
/*Query is similar to dispatch (sends a message to an actor's mailbox) but
it also creates a virtual Actor. When the virtual actor receives a message
the promise returned by the query resolves. Basically it is dispatch but blocking, waiting
for a response*/
const generateQuote = spawnStateless(system, async (msg, ctx) => {
    await delay(2000);
    dispatch(msg.sender, {quote: "This is such epic bean"});    
}, 'generate-quote')

const getQuote = spawnStateless(system, async (msg, ctx) => {
    const response = await query(generateQuote, (sender) => Object.assign(msg, {sender}), 3000);
    console.log(response)
}, 'get-quote')

dispatch(getQuote, {});

//HIERARCHY
/*Actors are arranged hierarchically. Actors can create child actors and every actor has a parent.
The lifecycle of an actor is tied to its parent. This provides means of reasoning with failure/system shutdown.
*/

//Child processes can be achieved by creating actor spawners as functions
const spawnChildActor = (parent, childName) => spawnStateless(
    parent, 
    (msg, ctx) => {
        console.log(msg.echo)
    },
    childName
)

//The parent actor can now invoke the function to make child actors
const parentActor = spawnStateless(
    system,
    (msg, ctx) => {
        const childActor = spawnChildActor(ctx.self, "child1");
        dispatch(childActor, msg);
    },
    "parent-actor"
)

dispatch(parentActor, {echo: "testing"})

//SUPERVISION
/*Actor systems have the let it crash philosophy. We achieve resilience by supervising actors.
When an actor crashes, the programmer can specify a function which takes in the exception which was thrown and additional details.
The supervision policy reutrns a decision such as stopping, resetting, resuming or escalating the error
*/

const reset = async (msg, error, ctx) => {
    await delay(Math.random() * 500 - 750);
    return ctx.reset;
};

const dumbActor = spawn(
    system,
    (msg, ctx) => {
        console.log("yey");
        throw "Hehe i'm problematic";
    },
    "dumbActor",
    {onCrash: reset}
)

dispatch(dumbActor, {})