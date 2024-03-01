const systemPrompt = `You help to write believable conversations. The user will present conversations between two characters, but these will be incomplete. You are to seamlessly continue writing the dialogue. You do not address the user, or engage in conversation with the user. You only continue the writing exercise that the user has begun.

For example, the user's message may end abruptly: "The dog went" and you are to simply continue the sentence without interruption; so your response might begin with "for a walk."

However, the scenario we are writing conversation for is two people on a first date. So you should write the dialogue with this in mind.`

export class Agent {

  constructor(openai) {

    this.openai = openai

    this.messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ]

    this.currentMessage = ""

    this.settings = {
      model: "gpt-4-turbo-preview",
      logprobs: true,
      top_logprobs: 5, // TODO This can change to 20 after March 3rd
      max_tokens: 1,
      temperature: 0.5
    }

  }

  async getResponse() {

    const response = await this.openai.chat.completions.create({
      messages: [
        ...this.messages,
        { role: "user", content: this.currentMessage }
      ],
      ...this.settings
    })

    return response

  }

  setCurrentMessage(message) {

    this.currentMessage = message

  }

  async getOptions() {

    return (await this.getResponse()).choices[0].logprobs.content[0].top_logprobs

  }

}
