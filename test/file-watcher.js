import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
const expect = chai.expect;
chai.should();
chai.use(sinonChai);

import FileWatcher from '../src/file-watcher';

import fs from 'fs';
import readline from 'readline';

describe('file-watcher', function () {
  let sandbox, log, emit, fileWatcher, logFile;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    log = { zoneChange: sandbox.spy(), gameStart: sandbox.spy(), gameOver: sandbox.spy() };
    emit = sandbox.spy();

    logFile = __dirname + '/artifacts/dummy-achievements.log';
    fileWatcher = new FileWatcher(logFile);
  });

  afterEach(function () {
    sandbox.restore();
    fs.truncateSync(logFile);
  });

  describe('start', function () {
    it('logs get detected', function (done) {
      fileWatcher.start(function(buffer) {
        var newLogs = buffer.toString();
        expect(newLogs).to.include('NotifyOfCardGained');
        done();
      });

      var lineReader = readline.createInterface({
        input: fs.createReadStream(__dirname + '/fixture/Achievements.log')
      });
      lineReader.on('line', function (line) {
        var fileDescriptor = fs.openSync(logFile, 'a');
        fs.writeSync(fileDescriptor, line);
        fs.writeSync(fileDescriptor, '\n');
        fs.closeSync(fileDescriptor);
      });
    });
  });
});
