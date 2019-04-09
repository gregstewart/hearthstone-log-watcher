export default function (line, parserState, emit, log) {
  var cardRegex = /D (.*) NotifyOfCardGained: \[name=(.*) cardId=(.*) type=(.*)\] (NORMAL|GOLDEN) (.*)/;
  var packState = parserState.pack || { cards: [] };

  if (cardRegex.test(line)) {
    var parts = cardRegex.exec(line);
    var cardData = {
      cardName: parts[2],
      cardId: parts[3],
      cardType: parts[4],
      golden: parts[5],
      qty_owned: parts[6]
    };

    if (packState.cards.length === 0) {
      packState.firstLogTime = parts[1];
    }
    if (packState.cards.length < 5) {
      packState.cards.push(cardData);
    }
    if (packState.cards.length === 5) {
      const finalState = JSON.parse(JSON.stringify(packState));
      emit('pack-opened', finalState);
      packState.cards = [];
      packState.firstLogTime = null;
    }
    parserState.pack = packState;
  }

  return parserState;
}
