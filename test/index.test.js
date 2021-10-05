const Termit = require('../index.js');
const path = require("path");

describe('termit as cli',()=> {
    it('open file successfuly',()=>{
        let termit = new Termit();
        termit.load(path.join('test','testFile.txt'));
        const text = termit.getText('testFile.txt');
        expect(text).toEqual('Termit - The TERMinal edITor');
    })
})