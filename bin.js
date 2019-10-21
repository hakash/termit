#!/usr/bin/env node

const Termit = require('./index.js');

let args = process.argv.slice(2);

let termit = new Termit();
termit.init(args[0]);