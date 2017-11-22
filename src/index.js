import { EventEmitter } from 'events';
import util from 'util';
import fs from 'fs';
import path from 'path';
import extend from 'extend';

import ParserState from './parser-state';
import findPlayerName from './find-player-name';
import newPlayerIds from './new-player-ids';
import handleZoneChanges from './handle-zone-changes';
import handleGameOver from './handle-game-over';
import setUpLogger from './set-up-debugger';
import getDefaultOptions from './default-options';

const log = setUpLogger();

// The watcher is an event emitter so we can emit events based on what we parse in the log.
export default class extends EventEmitter {
  constructor (options) {
    super();
    this.options = extend({}, getDefaultOptions(log), options);

    log.main('config file path: %s', this.options.configFile);
    log.main('log file path: %s', this.options.logFile);

    // Copy local config file to the correct location. Unless already exists.
    // Don't want to break other trackers
    var localConfigFile = path.join(__dirname, './log.config');
    fs.access(localConfigFile, (err) => {
      if (err) {
        // log config file does not exist
        fs.createReadStream(localConfigFile).pipe(fs.createWriteStream(this.options.configFile));
        log.main('Copied log.config file to force Hearthstone to write to its log file.');
      } else {
        log.main('Using pre-exisiting log.config file.');
      }
    });
  }

  start () {
    var self = this;

    var parserState = new ParserState;

    log.main('Log watcher started.');
    // Begin watching the Hearthstone log file.
    var fileSize = fs.statSync(self.options.logFile).size;
    fs.watchFile(self.options.logFile, function (current, previous) {
      if (current.mtime <= previous.mtime) { return; }

      // We're only going to read the portion of the file that we have not read so far.
      var newFileSize = fs.statSync(self.options.logFile).size;
      var sizeDiff = newFileSize - fileSize;
      if (sizeDiff < 0) {
        fileSize = 0;
        sizeDiff = newFileSize;
      }
      var buffer = new Buffer(sizeDiff);
      var fileDescriptor = fs.openSync(self.options.logFile, 'r');
      fs.readSync(fileDescriptor, buffer, 0, sizeDiff, fileSize);
      fs.closeSync(fileDescriptor);
      fileSize = newFileSize;

      self.parseBuffer(buffer, parserState);
    });

    self.stop = function () {
      fs.unwatchFile(self.options.logFile);
      delete self.stop;
    };
  }

  stop () {}

  executor (line, state) {
    var self = this;

    state = handleZoneChanges(line, state, self.emit.bind(self), log);
    state.players = newPlayerIds(line, state.players);
    state.players = findPlayerName(line, state.players);
    state = handleGameOver(line, state, self.emit.bind(self), log);

    return state;
  }

  parseBuffer (buffer, parserState) {
    var self = this;

    if (!parserState) {
      parserState = new ParserState;
    }

    // Iterate over each line in the buffer.
    buffer.toString().split(this.options.endOfLineChar).forEach(function (line) {
      parserState = self.executor(line, parserState);
    });
  }
}
