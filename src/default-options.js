import os from 'os';
import path from 'path';

export default function (log) {
  let defaultOptions = {
    endOfLineChar: os.EOL,
    fsPollInterval: 250
  };
  // Determine the default location of the config and log files.
  if (/^win/.test(os.platform())) {
    log.main('Windows platform detected.');
    var programFiles = 'Program Files';
    if (/64/.test(os.arch())) {
      programFiles += ' (x86)';
    }
    defaultOptions.logFile = path.join('C:', programFiles, 'Hearthstone', 'Hearthstone_Data', 'output_log.txt');
    defaultOptions.configFile = path.join(process.env.LOCALAPPDATA, 'Blizzard', 'Hearthstone', 'log.config');
  } else {
    log.main('OS X platform detected.');
    defaultOptions.logFile = path.join(process.env.HOME, 'Library', 'Logs', 'Unity', 'Player.log');
    defaultOptions.configFile = path.join(process.env.HOME, 'Library', 'Preferences', 'Blizzard', 'Hearthstone', 'log.config');
  }

  return defaultOptions;
}
