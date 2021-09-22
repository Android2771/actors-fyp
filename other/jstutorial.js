//EVENT LOOP
//The event loop will first handle all synchronous code in the script
//Then, it will check if there are any messages or callbacks in the queue.
//In this case, the first iteration of the event loop will first handle the synchronous code and then check for callbacks
//Like this, you can offload long jobs in callback functions without blocking the main javascript thread

setTimeout(() => console.log("third"), 0);
console.log("first")

//Note that promises are in the microtask queue which have precedence over the task queue.
Promise.resolve().then(v => console.log("second"))

/*To summarise:
1. Run synchronous code
2. Run promise/microtask callbacks
3. Run asynchronous task callbacks
*/

//TRUTHY AND FALSY

//We can check the type of variables like this
//Note that anything that is not a primitive type inherits from object. Eg: functions, arrays, classes
console.log(typeof "23");   //number

//Javascript has truthy and falsy and will try to coerce any type into a truthy/falsy when needed
console.log(!!{})   //true
console.log(!![])   //true
//Empty string is false while non empty string is true
console.log(!! '');     //false
console.log(!! 'hi');   //true
//0 is false, any other is true
console.log(!! 0);  //false
console.log(!! -1); //true

//VARIABLES
//var allows you to assign values to it and reassign values. Primitive types are immutable
var x;
x = 'something';
x = 'something else';

//x is a global variable, it is available in the global execution context which is available in all functions. Think of the script as a function
function test(){
    l = 'This becomes a global variable since it is not preceded by var'
}

//let/const is similar to var but it is limited to the scope of a block statement. It is limited to the block unlike var which leaks out to the parent scope
{
    var y = 3
}
console.log(y)

//HOISTING
//Javascript moves up declarations, but the actual assignment is done wherever you did the code

//FUNCTIONS
//Javascript functions are treated as first class citizens like variables. They can be passed/returned to other functions
//Anything inside curly braces is its own lexical environment. These contain local variables and references to variables of the outer functions. 
function outer(){
    const fish = 'fish';
    let count = 0;

    //This is a closure, the variable in the outer function will be maintained in memory even after the outer function has been returned.
    //The inner function always has access to the state from the outer function at the time it was created
    function inner(){
        count++;
        return `${count} ${fish}`
    }

    return inner;
}

//This is how you create a closure. It is similar to a class instance in an OOP language.
//This is because you have a function that contains a state and an inner function can operate/change that state.
//This is similar to class properties and methods. In fact classes in javascript are just syntactic sugar for functions and closures
const inner = outer();
console.log(inner());
console.log(inner());
console.log(inner());

//Here is using closures to make something similar to react hooks
function useName(){
    let name = 'default'

    return [
        () => name, //getter
        (newName) => name = newName //setter
    ]
}

const [getName, setName] = useName();
console.log(getName())  //default
setName("new default")
console.log(getName())  //new default

//Instead of function with multiple parameters, you can pass the object and desturcture inside
function makeLunch(opts){
    const {main, side, drink} = opts;   //descruturing
    return `Lunch includes ${main}, ${side}, and ${drink}.`
}

console.log(makeLunch({main: "burger", side: "fires", drink: "sprite"}));

//Rest parameter, you can pass as many parameters as you want and you can access them as an array in the function 
function makeDinner(...args){
    return `Dinner includes ${args.join(' ')}.`;
}

console.log(makeDinner("burger", "fries", "sprite"));

//Impure functions mutate values outside of its local scope. Pure functions only mutate variabels in the local scope, no side effects
//You can pass functions as arguments to other functions. These are called higher order functions

//OBJECTS
//Objects are made out of properties which are composed of a key and a value. They are kept as references in the heap
const obj = {
    name: 'Clown',
    hello: function(){
        console.log(`hello ${this.name}`)   //this refers to the object that it is defined on
    },
    hello2: () => {
        console.log(this)   //when it comes to the arrow function it does not have bindings to this, so this becomes the global object
    }
}

obj['name'] = 'I can mutate properties on an object even when it is defined as a const variable'
obj.hello();

const parent = {
    someValue: 1
}

//This will make a new object with a prototype set to the parent object. It is an invisible property but still accessible as it's on the prototype
const child = Object.create(parent)
console.log(child)  //{}
console.log(child.someValue)    //1

//You can use the define property function to set key value pairs
//It takes the object as the first param, key as the second and the descriptor as the third argument
Object.defineProperty(child, 'newValue', {
    get: () => 2,
    enumerable: false,
});
console.log(child.newValue)

//But use the literal syntax
const legs = 8
const eyes = 2
const obj2 = {
    legs,    //coerces the variable name to the propety name
    eyes,
    [Math.random()]: true,   //by using square brackets on key, the name of the key is set to that which is inside
}

const {legs2, eyes2} = obj2;   //destructuuring

//You can chain function calls since this refers to the parent object
const chainedObj = {
    web: '',
    makeWeb(){
        this.web += '***';
        return this;
    }
}

//This wouldn't work if makeWeb() was an anonymous function since it wouldn't refer to the object but to the global scope
console.log(chainedObj.makeWeb().makeWeb().makeWeb())   //in this case every function call will return the reference to the original object

//Since objects are stored in the heap, when you set one object to another then they are referring to the same object in memory

//You can copy objects like thiis
let a = {value: 1}
let b = Object.assign({}, a);
//However if a has references to other objects then the assign wont recursively copy the other objects

//Also only the internal properties get copied, which you can get using Object.getOwnPropertyNames

//THIS
//This refers to the object that is executing the current function

//For example, if a function is in an object (method), this will refer to the object itself
const clown = {
    face : 'clown',
    method: function(){
        console.log(this);
    }
}
console.log(clown.method());    //clown object

function hello(){
    return this;
}

//You can use the call function to pass this
const result = hello.call(clown);
console.log(result)     //clown object

this.globalVar = 5

function testThis(){
    console.log(this);  //in a function, this refers to the global object
}

testThis();

//Constructor, using function to instantiate/create a new object
function Video(title){
    this.title = title;
    this.getTitle = function(){
        return this.title;
    }
}

const v = new Video('b');   //the new keyword will create a new object and bind this to it
console.log(v.getTitle())

//the class keyword is just syntactic sugar for the process above