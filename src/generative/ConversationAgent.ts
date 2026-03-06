/**
 * Note: This file is not used in this codebase.
 * It is given as reference of what actually ended up in Conversation(A/I)symmetry.
 * The two significant differences are:
 *   - We use an older `completions` model, not a `chat completions` model.
 *   - We menually keep track of a conversation between two participants
 * It is taken from the final C(A/I)S codebase, so it is in typescript, and import errors are expected.
 */

import OpenAI from "openai"
import type ConversationServer from "../server"
import type { Message, NextOption, Participant } from "../shared"

const systemPrompt = `You are a world-class screenwriter, writing believable and interesting dialogue for romantic comedies.

We are writing a scene in which two people are on a first date. They are anonymous; the two characters never refer to each other by name, and their genders are never revealed. For written clarity, each line of dialogue will be preceded by A or B, indicating which character is speaking, but the characters themselves will never use these designations.

We will never include stage direction or action in the dialogue. We will only write the dialogue itself. We will never include quotation marks around the dialogue, either.

So an example of the format we're looking for is:

A: Hi, how are you?
B: I'm great, thanks. How about you?
A: I'm doing well, thanks. I'm excited to be here.
B: Me too. I've been looking forward to this all week.

But the actual dialogue that we are writing will be much more engaging and flirtatious than the above example.

The characters are meeting for the first time, and they are both excited and a little nervous; but are making extra efforts to be fun and flirtatious, with a focus on getting to know each other. The dialogue should be engaging and entertaining, with a good balance of humor, sincerity, and flirtation.

Now we are going to continue the partial dialogue below.

NOTE: We will never start a new line of dialogue; I have already filled in either A: or B:, and your role is just to continue writing that particular latest line of dialogue.

`

export function isEndOfSentence(_str: string) {
  const str = _str.trim()
  return str.endsWith(".") || str.endsWith("!") || str.endsWith("?")
}

function sanitiseOption(option: string): string | null {

  // Certain elements indicate an undesired option
  if (option.includes("(") || option.includes(")")) {
    return null
  }

  // Certain elements should be removed
  let output = option
    .replaceAll("<|endoftext|>", "")
    .replaceAll("endoffile", "")
    .replaceAll("\n", " ")
    .replaceAll("\\", "")
    // Replace all non-alphanumeric or puncutation characters
    .replaceAll(/[^a-zA-Z0-9.,!?'£$&() :-]/g, "")

  if (output === "") {
    return null
  }

  // Other elements are okay to be included but should
  // never make up the entire output
  let testOutput = output
    .replaceAll(/[A-Z]/g, "")
    .replaceAll(":", "")
    .trim()

  // If after having removed all the undesired elements we are left with nothing, return null
  if (testOutput === "") {
    return null
  } else {
    return output
  }

}

export class ConversationAgent {

  private settings: Omit<OpenAI.Completions.CompletionCreateParamsNonStreaming, "prompt"> = {
    model: 'gpt-3.5-turbo-instruct',
    // model: "gpt-4-turbo-preview",
    logprobs: 20,
    n: 1,
    // top_logprobs: 20,
    max_tokens: 1,
    temperature: 0.0
  } as const

  private pseudonyms: Record<Participant["id"], string> = {}
  private currentMessages: Record<Participant["id"], Message | undefined> = {}
  public conversation: Message[] = []

  constructor(private server: ConversationServer) {

  }

  resetCurrentMessage(participant: Participant | string) {

    /**
     * The current message of each user is kept up-to-date and incorporated into prompt,
     * even when only partially complete
     */

    const id = (typeof participant === "string") ? participant : participant.id

    this.server.broadcast({ type: "currentMessageReset", participantId: id })

    this.currentMessages[id] = { participantID: id, message: "" }

  }

  get firstUser(): Participant["id"] | null {
    return this.conversation[0]?.participantID || null
  }

  private getCurrentMessage(participant: Participant): Message {

    if (this.currentMessages[participant.id] === undefined) {
      this.resetCurrentMessage(participant)
    }

    return this.currentMessages[participant.id]!

  }

  private getMessageString(msg: Message, useColorPseudonyms: boolean) {

    return `${this.getPseudonym(msg.participantID, useColorPseudonyms)}: ${msg.message}`

  }

  public getConversationString(participant?: Participant, useColorPseudonyms = false) {

    /**
     * Format the conversation as a string, to be included in the prompt to LLM
     */

    const messages = [...this.conversation]

    if (participant) {
      messages.push(this.getCurrentMessage(participant))
    }

    const conversationString = messages.map(m => this.getMessageString(m, useColorPseudonyms)).join("\n")

    return conversationString

  }

  async getResponse(prompt: string, settings: Partial<OpenAI.Completions.CompletionCreateParamsNonStreaming> = {}) {

    const response = await this.server.openAi.completions.create({
      ...this.settings,
      ...settings,
      prompt,
    })

    return response

  }

  async getNextOptions(participant: Participant): Promise<NextOption[]> {

    /**
     * This is the main function that gets the next options from the LLM
     * It takes the current conversation and the current message (if any) for the
     * given participant, and returns the options provided by the LLM for the next possible token
     */

    const prompt = this.getPrompt(participant)
    const response = await this.getResponse(prompt)

    const top_logprobs = response?.choices[0]?.logprobs?.top_logprobs?.[0]

    if (!top_logprobs) {
      console.error("No logprobs response");
      console.log(response)
      return []
    }

    // Filter out any undesired options provided by LLM
    // (undesired by me for design reasons, eg. overly complex punctuation or LLM-specific tokens)
    const filtered_logprobs: NextOption[] = Object.entries(top_logprobs)
      .map(([option, logprob]) => {

        const editedOption: NextOption | [null, number] = [
          sanitiseOption(option),
          logprob
        ]

        return editedOption

      })
      .filter((o) => (o[0] !== null))

    return filtered_logprobs

  }

  private getPrompt(participant: Participant): string {

    const prompt = [
      systemPrompt,
      this.getConversationString(participant),
    ].join("\n")

    return prompt

  }

  private getColourPseudonym(participantID: string) {

    /**
     * When provided to commenters, we refer to the participants as Purple and Grey
     */

    if (this.firstUser === participantID) {
      return "Purple"
    } else {
      return "Grey"
    }

  }

  private getPseudonym(participantID: string, useColorPseudonyms = false) {

    // This converts a weird ID string like oiwjfd0y230832 to a pseudonym like A
    // Used to make it simpler for the LLM to interpret the conversation:

    if (useColorPseudonyms && this.firstUser !== null) {

      return this.getColourPseudonym(participantID)

    }

    if (this.pseudonyms[participantID] === undefined) {

      const pseudonymCount = Object.keys(this.pseudonyms).length
      const pseudonym = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[pseudonymCount % 26] // There shouldn't ever be more than 2 anyway

      this.pseudonyms[participantID] = pseudonym

    }

    return this.pseudonyms[participantID]

  }

  public submitOption(participant: Participant, option: string) {

    /**
     * Add the selected option to the current message
     * If the option ends a sentence, submit the current message permanently to the conversation
     */

    const currentMessage = this.getCurrentMessage(participant)

    currentMessage.message += option

    if (isEndOfSentence(option)) {
      this.submitCurrentMessage(participant)
    }

  }

  private submitCurrentMessage(participant: Participant) {

    const message = this.getCurrentMessage(participant)
    message.message = message.message.trim()

    if (message.message === "") { return }

    this.conversation.push(message)
    this.resetCurrentMessage(participant)

    this.server.setConversation(this.conversation)

  }

}
