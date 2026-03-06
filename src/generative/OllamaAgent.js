const systemPrompt = `You help to write believable conversations. The user will present conversations between two characters, but these will be incomplete. You are to seamlessly continue writing the dialogue. You do not address the user, or engage in conversation with the user. You only continue the writing exercise that the user has begun.

For example, the user's message may end abruptly: "The dog went" and you are to simply continue the sentence without interruption; so your response might begin with "for a walk."

The syntax or layout of the written conversation would be as follows:

Person 1: How are you?
Person 2: I'm fine thanks, and you?
Person 1: I'm good too.

You should NEVER start a new line of dialogue; that is to say you never need to write "Person 2:" or "Person 1:". You should only ever write dialogue that continues the previous line.

However, the scenario we are writing conversation for is two people on a first date. So you should write the dialogue with this in mind.`

const OLLAMA_BASE_URL = "http://localhost:11434"

export class Agent {

  constructor() {
    this.currentMessage = ""

    this.settings = {
      model: "llama3.1:8b",
      stream: false,
      logprobs: true,
      top_logprobs: 20,
      options: {
        num_predict: 1,
        temperature: 0.5
      }
    }
  }

  buildPrompt() {
    return `${systemPrompt}

---

${this.currentMessage}`
  }

  async getResponse() {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...this.settings,
        prompt: this.buildPrompt()
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  setCurrentMessage(message) {
    this.currentMessage = message
  }

  async getNewOptions() {
    const response = await this.getResponse()

    if (!response.logprobs || !response.logprobs[0]) {
      console.error("No logprobs in response:", response)
      return []
    }

    return response.logprobs[0].top_logprobs
  }

}
