export class Sentence {

  constructor() {
    this.words = []
  }

  addWord(word) {
    this.words.push(word)
  }

  getNextWord() {

    const choices = [
      "potato",
      "tomato",
      "banana",
      "apple",
      "orange",
      "carrot",
      "cucumber",
    ]

    return choices[Math.floor(Math.random() * choices.length)]

  }

  toString() {
    return this.words.join(" ")
  }

}