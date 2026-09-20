const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The file was read as utf8. 
// If it contains double-encoded utf8, we can convert it by turning it into latin1.
// Let's find "NÃ­vel" in the content and see if it converts correctly.

let match = content.match(/N.{1,4}vel/);
if (match) {
    let str = match[0];
    console.log("Original matched:", str);
    let decoded = Buffer.from(str, 'latin1').toString('utf8');
    console.log("Decoded via Buffer.from(..., 'latin1').toString('utf8'):", decoded);
    let decoded2 = Buffer.from(str, 'utf8').toString('latin1');
    console.log("Decoded via Buffer.from(..., 'utf8').toString('latin1'):", decoded2);
}
