export default class {
  constructor () {
    this.reset();
  }
  reset () {
    this.players = [];
    this.playerCount = 0;
    this.gameOverCount = 0;
    this.pack = {
      cards: [],
      firstLogTime: null
    };
  }
}
