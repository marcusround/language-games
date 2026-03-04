import { Agent } from "./generative/Agent"

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
        console.log("this.nextOptions", this.nextOptions)
      })

  }

  addWord(word) {

    this.words.push(word)
    this.agent.setCurrentMessage("Person 1: " + this.toString())

    console.log(this.words)
    this.updateOptions()

  }

  getNextWord() {

    // Return a random option
    const randomOption = Array.from(this.nextOptions)[Math.floor(Math.random() * this.nextOptions.size)]

    console.log(randomOption)

    return randomOption?.token

  }

  toString() {
    return this.words.join(" ")
  }

}