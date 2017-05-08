var fs = require('fs');
var zipStream = require('zip-stream');

var API = module.exports = function(pathToSaveArchive, options) {
	if (!(this instanceof API)) {
		return new API(pathToSaveArchive, options);
	}
	if (!pathToSaveArchive) throw new Error('Enter the path to save the archive');
	if (!options) options = {};

	var self = this;
	var compressed = options.compressed || 6;
	self.finishCallback = null;

	self.queue = [];
	self.bQueueProcessing = false;

	self.zip = new zipStream({zlib: {level: compressed}});

	var writeStream = fs.createWriteStream(pathToSaveArchive);
	writeStream.on('finish', function() {
		if (self.finishCallback !== null && typeof self.finishCallback === 'function') self.finishCallback.call(this);
	});

	if (options.cipher) {
		self.zip.pipe(options.cipher).pipe(writeStream);
	} else {
		self.zip.pipe(writeStream);
	}

	self.zip.on('error', function(err) {
		throw err;
	});
};

API.prototype.file = function(name, path) {
	var self = this;
	fs.stat(path, function(err) {
		if (err) throw err;
		self.queue.push({name: name, data: fs.createReadStream(path)});
		self.queueProcessing();
	});
};

API.prototype.text = function(name, text) {
	this.queue.push({name: name, data: text});
	this.queueProcessing();
};

API.prototype.queueProcessing = function() {
	var self = this;
	if(self.bQueueProcessing) return;
	if(self.queue.length){
		self.bQueueProcessing = true;
		self.zip.entry(self.queue[0].data, {name: self.queue[0].name}, function(err) {
			if(err) throw err;
			self.queue.shift();
			self.bQueueProcessing = false;
			setTimeout(function(){
				self.queueProcessing();
			}, 10);
		})
	}else{
		self.bQueueProcessing = false;
		self.zip.finish();
	}
};

API.prototype.end = function(callback) {
	this.finishCallback = callback;
};