'use strict';
const terminalKit = require('terminal-kit');
const fs = require('fs');


let defaults = {
	statusBar: {
		message: 'Ctrl+?: X:save&eXit C:exit O:Open S:Save A:save As K:cut line U:paste line'
	},
	titleBar: {
		title: 'Welcome to Termit - The TERMinal edITor!'
	}
};

class Termit {
	constructor(options = {}) {

		this.disableOpen = options.disableOpen || false;
		this.disableSaveAs = options.disableSaveAs || false;
		defaults.titleBar.title = options.title || defaults.titleBar.title;

		this.term = terminalKit.terminal;
		this.statusBarTimer = undefined;
		this.fileIsModified = false;

		this.screenBuffer = new terminalKit.ScreenBuffer({
			dst: this.term,
			height: this.term.height - 2,
			y: 2
		});

		this.textBuffer = new terminalKit.TextBuffer({
			dst: this.screenBuffer
		});
		this.textBuffer.setText('');


	}

	init(file) {
		this.term.on('resize', this.onResize.bind(this));
		this.term.on('key', this.onKey.bind(this));

		this.term.fullscreen(true);

		this.textBuffer.moveTo(0, 0);
		this.screenBuffer.moveTo(0, 0);

		this.term.grabInput({
			mouse: false
		});
		this.drawStatusBar();
		this.drawTitleBar();

		this.draw();

		if(file){
			this.load(file);
		}
	}

	drawBar(pos, message, invert = false) {
		if(invert){
			this.term.moveTo(pos.x, pos.y).styleReset.white.bold.eraseLine(' ' + message);
		}
		else {
			this.term.moveTo(pos.x, pos.y).styleReset.bgWhite.black.bold.eraseLine(' ' + message);
		}
	}

	drawPrompt(prompt){
		this.drawBar({
			x: 0,
			y: this.term.height
		}, prompt, true);
		if(this.statusBarTimer) {
			clearTimeout(this.statusBarTimer);
		}

	}

	drawStatusBar(message = defaults.statusBar.message, timeout = -1) {
		this.drawBar({
			x: 0,
			y: this.term.height
		}, message);

		this.textBuffer.draw();
		this.screenBuffer.draw({delta:true});
		this.textBuffer.drawCursor();
		this.screenBuffer.drawCursor();

		if(this.statusBarTimer) {
			clearTimeout(this.statusBarTimer);
		}

		if (timeout >= 0) {

			this.statusBarTimer = setTimeout(() => {
				this.drawStatusBar();
			}, timeout);
		}

	}

	drawTitleBar() {
		this.drawBar({
			x: 1,
			y: 1
		}, defaults.titleBar.title);
	}

	open(){
		if(this.disableOpen) { return; }
		
		this.getFileName('Open file: ',file => this.load(file));
	}

	load(file){
		let content = '';
		this.disableUserInteraction = true;
		try {
			if(fs.existsSync(file)){
				content = fs.readFileSync(file,'utf8');
			}
			this.currentFile = file;
		}
		catch(e){
			this.drawStatusBar('ERROR: Failed to load file: ' + file, 3500);
		}

		this.textBuffer.moveTo(0,0);
		this.textBuffer.setText('');
		this.textBuffer.insert(content);
		this.textBuffer.moveTo(0,0);
		this.fileIsModified = false;
		this.disableUserInteraction = false;
		this.draw();
	}

	save(file, callback = ()=>{}){
		this.disableUserInteraction = true;
		try {
			fs.writeFileSync(file, this.textBuffer.getText());
			this.fileIsModified = false;
			this.currentFile = file;
			this.drawStatusBar('Saved!', 2000);
			this.disableUserInteraction = false;
			callback();
		}
		catch(e){
			this.disableUserInteraction = false;
			callback(e);
		}
	}

	saveAs(callback){
		if(this.disableSaveAs) { return; }

		this.getFileName('Save as: ', file => this.save(file, callback), this.currentFile);
	}

	saveFile(callback){
		if(this.currentFile){
			this.save(this.currentFile, callback);
		}
		else {
			this.saveAs(callback);
		}
	}

	getFileName(prompt, callback, prefill = '') {
		this.disableUserInteraction = true;

		this.drawPrompt(prompt);
		let fileOptions = { cancelable: true, default: prefill};
		this.term.fileInput(fileOptions, (err, file) => {
			this.disableUserInteraction = false;

			this.drawStatusBar();
			if (err) {
				this.drawStatusBar('An error occurred.', 3000);
				callback(err);
				return;
			}
			if (!file) {
				return;
			}
			callback(file);
		});
	}

	saveAndExit() {
		if(this.disableSaveAs && this.currentFile){
			this.save(this.currentFile, err => {
				if(err){
					this.drawStatusBar('ERR: Could not save file. Hit Ctrl + C to force exit.', 4000);
					return;
				}

				this.exit();
			});			
		}
		else {
			this.saveAs(err => {
				if(err){
					this.drawStatusBar('ERR: Could not save file. Hit Ctrl + C to force exit.', 4000);
					return;
				}

				this.exit();
			});			
		}
	}

	exit() {
		setTimeout(()=>{
			this.term.grabInput(false);
			this.term.fullscreen(false);

			setTimeout( () => process.exit(0), 100);
		}, 100);
	}

	onResize(width, height) {
		//this.screenBuffer.
		//console.log(arguments);
		if(this.resizeTimer){
			clearTimeout(this.resizeTimer);
		}
		this.resizeTimer = setTimeout(()=>{
			this.screenBuffer.resize({
				x:0,
				y: 2,
				width: width,
				height: height - 2
			});
			this.drawStatusBar();
			this.drawTitleBar();
			this.draw();
		},150);
	}
	
	onKey(key, matches, data) {
		if(this.disableUserInteraction && key !== 'CTRL_C') { return; }

		switch (key) {
			case 'CTRL_C':		this.exit(); 				break;
			case 'CTRL_X':		this.saveAndExit(); 		break;
			case 'CTRL_S':		this.saveFile();			break;
			case 'CTRL_A':		this.saveAs();				break;
			case 'CTRL_O':		this.open();	 			break;
			case 'CTRL_K':		this.cutLine();	 			break;
			case 'CTRL_U':		this.pasteLine();			break;
			case 'PAGE_UP':		this.pgUp();	 			break;
			case 'PAGE_DOWN':	this.pgDown();	 			break;
			case 'UP':			this.up();		 			break;
			case 'DOWN':		this.down();	 			break;
			case 'LEFT':		this.left();				break;
			case 'RIGHT':		this.right();		 		break;
			case 'HOME':		this.startOfLine();	 		break;
			case 'END':			this.endOfLine();	 		break;
			case 'TAB':			this.tab();	 				break;
			case 'CTRL_HOME':	this.startOfText();	 		break;
			case 'CTRL_END':	this.endOfText();	 		break;
			case 'DELETE':		this.delete();			 	break;
			case 'BACKSPACE':	this.backspace();		 	break;
			case 'ENTER':		this.newLine();				break;
			default:
				if(data.isCharacter){
					this.fileIsModified = true;
					this.textBuffer.insert(key);
					this.draw();
				}			
		}
	}

	draw(delta = true) {
		this.textBuffer.draw();
		this.screenBuffer.draw({ delta: delta}); //{delta: delta});
		this.drawCursor();
	}

	drawCursor() {

		let new_buffer_x = this.textBuffer.x;
		let new_buffer_y = this.textBuffer.y;

		if(this.textBuffer.x < -this.textBuffer.cx){
			new_buffer_x = Math.min( 0 , -this.textBuffer.cx + Math.floor(this.screenBuffer.width / 2) ) ;
		}
		else if(this.textBuffer.x > -this.textBuffer.cx + this.screenBuffer.width -1 ){
			new_buffer_x = (this.screenBuffer.width / 2) - this.textBuffer.cx;
		}

		if(this.textBuffer.y < -this.textBuffer.cy){
			new_buffer_y = Math.min( 0 , -this.textBuffer.cy + Math.floor(this.screenBuffer.height / 2) ) ;
		}
		else if(this.textBuffer.y > -this.textBuffer.cy + this.screenBuffer.height -1 ){
			new_buffer_y = (this.screenBuffer.height / 2) - this.textBuffer.cy;
		}

		if(new_buffer_y != this.textBuffer.y || new_buffer_x != this.textBuffer.x){
			this.textBuffer.x = new_buffer_x;
			this.textBuffer.y = new_buffer_y;
			this.textBuffer.draw();
			this.screenBuffer.draw({delta:true});
		}

		this.textBuffer.drawCursor();
		this.screenBuffer.drawCursor();
	}

	up(){
		this.textBuffer.moveUp();
		if(this.textBuffer.cx > this.textBuffer.buffer[this.textBuffer.cy].length - 1){
			this.textBuffer.moveToEndOfLine();
		}
		this.drawCursor();
	}

	down(){
		if(this.textBuffer.getContentSize().height - 1 > this.textBuffer.cy){
			this.textBuffer.moveDown();

			if(this.textBuffer.cx > this.textBuffer.buffer[this.textBuffer.cy].length - 1){
				this.textBuffer.moveToEndOfLine();
			}
			this.drawCursor();
		}
	}

	left(){
		this.textBuffer.moveBackward();
		this.drawCursor();
	}

	right(){

		if(this.textBuffer.cx < this.getLine().length){
			this.textBuffer.moveRight();
		}
		else if(this.textBuffer.getContentSize().height - 1 > this.textBuffer.cy){
			this.textBuffer.moveTo(0,this.textBuffer.cy + 1);
		}
		this.drawCursor();
		
	}

	getLine() {
		return this.textBuffer.buffer[this.textBuffer.cy].reduce((acc, curr) => {
			acc += curr.char.trim();
			return acc;
		}, '');
	}

	startOfLine(){
		this.textBuffer.moveToColumn(0);
		this.drawCursor();
	}

	endOfLine(){
		this.textBuffer.moveToEndOfLine();
		this.drawCursor();
	}

	startOfText(){
		this.textBuffer.moveTo(0,0);
		this.draw();
	}

	endOfText(){
		let num_lines = this.textBuffer.getContentSize().height - 1;
		let last_line = this.textBuffer.buffer[num_lines];
		this.textBuffer.moveTo(last_line.length, num_lines);
		this.draw();
	}

	pgUp(){
		this.textBuffer.cy = Math.max(0, this.textBuffer.cy - Math.floor(this.screenBuffer.height / 2));
		this.draw();
	}

	pgDown(){
		this.textBuffer.cy = Math.min(this.textBuffer.getContentSize().height - 1, this.textBuffer.cy + Math.floor(this.screenBuffer.height / 2));
		this.draw();		
	}

	delete(){
		this.fileIsModified = true;
		this.textBuffer.delete(1);
		this.draw();
	}

	backspace(){
		this.fileIsModified = true;
		this.textBuffer.backDelete(1);
		this.draw();
	}

	newLine(){
		this.fileIsModified = true;
		this.textBuffer.newLine();
		this.draw();
	}

	tab(){
		this.fileIsModified = true;
		this.textBuffer.insert('\t');
		this.draw();
	}

	cutLine(){
		this.lineCutBuffer = this.textBuffer.buffer[this.textBuffer.cy];

		if(this.textBuffer.cy == 0 && this.textBuffer.buffer.length == 1)
		{
			this.textBuffer.buffer[0] = [];
			this.textBuffer.moveToEndOfLine();
		}
		else 
		{
			if(this.textBuffer.cy == this.textBuffer.buffer.length -1){
				this.textBuffer.buffer.splice(this.textBuffer.cy,1,[]);
			}
			else{
				this.textBuffer.buffer.splice(this.textBuffer.cy,1);
			}
			if(this.textBuffer.cx >= this.textBuffer.buffer[this.textBuffer.cy].length){
				this.textBuffer.moveToEndOfLine();
			}
		}
		this.fileIsModified = true;
		this.draw();

	}

	pasteLine(){
		if(this.lineCutBuffer){
			this.fileIsModified = true;
			this.textBuffer.buffer.splice(this.textBuffer.cy,0,this.lineCutBuffer);
			this.textBuffer.moveDown();
			this.draw();
		}
	}

}

module.exports = Termit;