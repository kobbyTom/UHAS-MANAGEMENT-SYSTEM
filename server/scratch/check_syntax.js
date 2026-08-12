const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const code = fs.readFileSync('client/src/pages/Reports/Reports.jsx', 'utf-8');

try {
  acorn.Parser.extend(jsx()).parse(code, {
    ecmaVersion: 2020,
    sourceType: 'module'
  });
  console.log('Syntax is valid');
} catch (e) {
  console.error('Syntax Error:', e.message);
  console.error('At position:', e.pos);
  
  const lines = code.substring(0, e.pos).split('\n');
  console.error('Line:', lines.length);
  console.error('Near:', code.substring(e.pos - 50, e.pos + 50));
}
