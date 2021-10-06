const Termit = require('../index.js');
const fs = require('fs');

const helloFile = 'test/test.txt'


test('Test that termit reads from file',()=>{
    fileContents = fs.readFileSync(helloFile, 'utf8');
    expect(fileContents).toBe('Hello Termit!');
})