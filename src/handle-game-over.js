export default function (line, parserState, emit, log) {
  // Check if the game is over.
  var gameOverRegex = /\[Power\] GameState.DebugPrintPower\(\)\s-\s*TAG_CHANGE Entity=(.*) tag=PLAYSTATE value=(LOST|WON|TIED)/;
  if (gameOverRegex.test(line)) {
    log.gameOver('Check if game has ended: ' + gameOverRegex.test(line));
    var parts = gameOverRegex.exec(line);
    // Set the status for the appropriate player.
    parserState.players.forEach(function (player) {
      var playerNameRegex = RegExp(player.name + '(#\d*)?','gi');
      if (playerNameRegex.test(parts[1])) {
        player.status = parts[2];
      }
    });
    parserState.gameOverCount++;
    log.gameOver('Players: ' + parserState.players);
    // When both players have lost, emit a game-over event.
    if (parserState.gameOverCount === 2) {
      log.gameOver('The current game has ended.');
      emit('game-over', parserState.players);
      parserState.reset();
    }
  }

  return parserState;
};
