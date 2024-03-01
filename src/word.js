export class Word {

  constructor(p5, word) {
    this.word = word;

    this.p5 = p5;
    this.position = this.p5.createVector(this.p5.width, this.p5.random(this.p5.height));
    this.speed = -4;

  }

  getWord() {

    return this.word;

  }

  update() {

    this.position.x += this.speed;

  }

  draw() {

    this.p5.text(this.word, this.position.x, this.position.y);

  }

}