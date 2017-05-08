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

API.prototype.file = function(name, path, callback) {
	this.zip.entry(fs.createReadStream(path), {name: name}, function(err) {
		if (callback && typeof callback === 'function') callback(err);
	});
};

API.prototype.text = function(name, text, callback) {
	this.zip.entry(text, {name: name}, function(err) {
		if (callback && typeof callback === 'function') callback(err);
	});
};

API.prototype.end = function(callback) {
	this.finishCallback = callback;
	this.zip.finish();
};