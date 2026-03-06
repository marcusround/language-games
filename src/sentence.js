import { Agent } from "./generative/OpenAIAgent"

export class Sentence {

  constructor(openai) {

    this.words = []

    this.agent = new Agent(openai)
    this.agent.setCurrentMessage("Person 1:")

    this.nextOptions = new Set()

  }

  updateOptions() {

    this.nextOptions.clear()

    this.agent.getNewOptions()
      .then(options => {
        options.forEach(option => {
          if (option.token && option.token !== " ") {
            this.nextOptions.add(option)
          }
        })
        const tokens = Array.from(this.nextOptions).map(o => o.token)
        console.log("Options:", tokens.join(" | "))
      })

  }

  addWord(word) {

    this.words.push(word)
    this.agent.setCurrentMessage("Person 1: " + this.toString())
    console.log("Sentence:", this.toString())
    this.updateOptions()

  }

  getNextWord() {

    const randomOption = Array.from(this.nextOptions)[Math.floor(Math.random() * this.nextOptions.size)]
    return randomOption?.token

  }

  toString() {
    return this.words.join(" ")
  }

}