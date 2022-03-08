const y = x => (1 / (x + 1)) * Math.sqrt(1 + Math.pow(Math.E, Math.sqrt(2 * x))) * Math.sin(Math.pow(x, 3) - 1);
// Function to evaluate the value of integral
function trapezoidal(a, b, n)
{
     
    // Grid spacing
    let h = (b - a) / n;
   
    // Computing sum of first and last terms
    // in above formula
    let s = y(a) + y(b);
   
    // Adding middle terms in above formula
    for(let i = 1; i < n; i++)
        s += 2 * y(a + i * h);
   
    // h/2 indicates (b-a)/2n. Multiplying h/2
    // with s.
    return (h / 2) * s;
}
 
// Driver code
 
// Range of definite integral
let x0 = 0;
let xn = 32;
 
// Number of grids. Higher
// value means more accuracy
let n = 100000000;

console.log(trapezoidal(x0, xn, n))