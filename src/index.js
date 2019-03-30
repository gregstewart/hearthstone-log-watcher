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
import FileWatcher from './file-watcher';

const log = setUpLogger();

// The watcher is an event emitter so we can emit events based on what we parse in the log.
export default class extends EventEmitter {
  constructor (options) {
    super();
    this.options = extend({}, getDefaultOptions(log), options);

    log.main('config file path: %s', this.options.configFile);
    log.main('log file path: %s', this.options.logFile);
    log.main('achievements log file path: %s', this.options.logFileAchievments);

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
    var logWatcher = new FileWatcher(self.options.logFile);
    logWatcher.start(function(buffer) {
      self.parseBuffer(buffer, parserState);
    });
    var achievementsLogWatcher = new FileWatcher(self.options.logFileAchievements);
    achievementsLogWatcher.start(function(buffer) {
      self.parseBuffer(buffer, parserState);
    });

    self.stop = function () {
      logWatcher.stop();
      achievementsLogWatcher.stop();
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
