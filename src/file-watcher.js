import fs from 'fs';

export default class FileWatcher {
	constructor(filePath) {
		this.filePath = filePath;
	}

	start(listener) {
		var fileSize = fs.statSync(this.filePath).size;
		fs.watchFile(this.filePath, function (current, previous) {
			if (current.mtime <= previous.mtime) { return; }
	
			// We're only going to read the portion of the file that we have not read so far.
			var newFileSize = fs.statSync(this.filePath).size;
			var sizeDiff = newFileSize - fileSize;
			if (sizeDiff < 0) {
			  fileSize = 0;
			  sizeDiff = newFileSize;
			}
			var buffer = new Buffer(sizeDiff);
			var fileDescriptor = fs.openSync(this.filePath, 'r');
			fs.readSync(fileDescriptor, buffer, 0, sizeDiff, fileSize);
			fs.closeSync(fileDescriptor);
			fileSize = newFileSize;
	  
			listener(buffer);
		});	
	}

	stop() {
		fs.unwatchFile(this.filePath);
	}
}