import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
const expect = chai.expect;
chai.should();
chai.use(sinonChai);

import handleCardGained from '../src/handle-card-gained';

describe('handle-card-gained', function () {
  let sandbox, log, emit;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    log = { zoneChange: sandbox.spy(), gameStart: sandbox.spy(), gameOver: sandbox.spy() };
    emit = sandbox.spy();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('parsing packs', function() {
    it('ignores random lines', function() {
      const parserState = {};
      const logLine = 'D 15:08:21.3775598 PopupDisplayManager: adding 0 rewards to load total=0';
      const newState = handleCardGained(logLine, parserState, emit, log);
      expect(newState).to.deep.equal(parserState);
      expect(emit).not.to.have.been.called;
    });

    it('stores first card', function() {
      const parserState = {};
      const logLine = 'D 15:08:54.0669559 NotifyOfCardGained: [name=Booty Bay Bookie cardId=TRL_504 type=MINION] NORMAL 1';
      const newState = handleCardGained(logLine, parserState, emit, log);
      expect(newState.pack.cards).to.have.lengthOf(1);
      expect(newState.pack.firstLogTime).to.equal('15:08:54.0669559');
      expect(emit).not.to.have.been.called;
    });

    it('stores second card, keeping original timestamp', function() {
      const parserState = {};
      const logLine1 = 'D 15:08:54.0669559 NotifyOfCardGained: [name=Booty Bay Bookie cardId=TRL_504 type=MINION] NORMAL 1';
      const logLine2 = 'D 15:08:54.0679811 NotifyOfCardGained: [name=Ticket Scalper cardId=TRL_015 type=MINION] NORMAL 2';
      const newState1 = handleCardGained(logLine1, parserState, emit, log);
      const newState2 = handleCardGained(logLine2, newState1, emit, log);
      expect(newState2.pack.cards).to.have.lengthOf(2);
      expect(newState2.pack.firstLogTime).to.equal('15:08:54.0669559');
      expect(emit).not.to.have.been.called;
    });

    it('detects 5th card, emits event, and clears state', function() {
      const parserState = {};
      const expectedEventData = {
        cards: [{
          cardId: "TRL_504",
          cardName: "Booty Bay Bookie",
          cardType: "MINION",
          golden: "NORMAL",
          qty_owned: "1"
        }, {
          cardId: "TRL_015",
          cardName: "Ticket Scalper",
          cardType: "MINION",
          golden: "NORMAL",
          qty_owned: "2"
        }, {
          cardId: "TRL_362",
          cardName: "Dragon Roar",
          cardType: "SPELL",
          golden: "NORMAL",
          qty_owned: "1"
        }, {
          cardId: "TRL_507",
          cardName: "Sharkfin Fan",
          cardType: "MINION",
          golden: "GOLDEN",
          qty_owned: "1"
        }, {
          cardId: "TRL_550",
          cardName: "Amani War Bear",
          cardType: "MINION",
          golden: "NORMAL",
          qty_owned: "1"
        }],
        firstLogTime: "15:08:54.0669559"
      };
      const logLine1 = 'D 15:08:54.0669559 NotifyOfCardGained: [name=Booty Bay Bookie cardId=TRL_504 type=MINION] NORMAL 1';
      const logLine2 = 'D 15:08:54.0679811 NotifyOfCardGained: [name=Ticket Scalper cardId=TRL_015 type=MINION] NORMAL 2';
      const logLine3 = 'D 15:08:54.0709580 NotifyOfCardGained: [name=Dragon Roar cardId=TRL_362 type=SPELL] NORMAL 1';
      const logLine4 = 'D 15:08:54.0709580 NotifyOfCardGained: [name=Sharkfin Fan cardId=TRL_507 type=MINION] GOLDEN 1';
      const logLine5 = 'D 15:08:54.0758987 NotifyOfCardGained: [name=Amani War Bear cardId=TRL_550 type=MINION] NORMAL 1';
      const newState1 = handleCardGained(logLine1, parserState, emit, log);
      const newState2 = handleCardGained(logLine2, newState1, emit, log);
      const newState3 = handleCardGained(logLine3, newState2, emit, log);
      const newState4 = handleCardGained(logLine4, newState3, emit, log);
      const newState5 = handleCardGained(logLine5, newState4, emit, log);
      expect(newState5.pack.cards).to.have.lengthOf(0);
      expect(newState5.pack.firstLogTime).to.be.null;
      expect(emit).to.have.been.calledWith('pack-opened', expectedEventData);
    });
  });
});
