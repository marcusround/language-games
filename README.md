# Machine Vision Word-Eating Sketch

A creative coding experiment built with **Vite + p5.js + MediaPipe Face Landmarker**.

The sketch uses your webcam to track mouth landmarks in real time. Generated words move across the screen, and words that enter the mouth region are "eaten" and appended to an evolving sentence.

## Features

- Real-time webcam capture in p5.js
- Face/mouth landmark detection with MediaPipe Tasks Vision
- Bounding-box mouth collision against animated words
- Token suggestion loop using LLM logprobs (next-token probabilities)

## Tech Stack

- Vite
- p5.js
- @mediapipe/tasks-vision
- Ollama (default) or OpenAI

## Prerequisites

- Node.js 18+
- A webcam
- **Ollama** (free, local) OR an **OpenAI API key** (paid)

## LLM Options

This project supports two LLM backends for generating word suggestions:

### Option 1: Ollama (Default, Free)

Ollama runs models locally on your machine — no API key or payment required.

**Quick Setup:**

1. Install Ollama from [ollama.com](https://ollama.com/)
2. Pull the model:
   ```bash
   ollama pull llama3.1:8b
   ```
3. Start Ollama (it may start automatically, or run `ollama serve`)
4. The app is already configured to use Ollama by default

For more details, see the [Ollama documentation](https://github.com/ollama/ollama).

**Hardware note:** The `llama3.1:8b` model requires ~8GB of VRAM/RAM. If you have limited resources, you can try smaller models like `llama3.2:3b` (edit the model name in `src/generative/OllamaAgent.js`).

### Option 2: OpenAI (Paid API Key)

If you prefer to use OpenAI's models (better quality, no local setup):

1. Get an API key from [platform.openai.com](https://platform.openai.com/)
2. Create a `.env` file:
   ```env
   VITE_OPENAI_API_KEY=your_api_key_here
   ```
3. In `src/sentence.js`, change the import:
   ```javascript
   import { Agent } from "./generative/OpenAIAgent"
   ```

**Note:** OpenAI API calls incur costs. The app uses `gpt-4-turbo-preview` by default.

## Setup

1. Install dependencies:

```bash
npm install
```

2. (If using OpenAI) Create a `.env` file with your API key (see above)

3. Start the development server:

```bash
npm run dev
```

4. Open the local Vite URL in your browser and allow webcam access.

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run preview` - preview production build locally

## Project Structure

- `main.js` - app entrypoint, p5 sketch, webcam + landmark pipeline
- `src/mouth.js` - mouth geometry, drawing, and collision checks
- `src/word.js` - moving word objects
- `src/sentence.js` - sentence state and token flow
- `src/generative/OllamaAgent.js` - Ollama wrapper for next-token options (default)
- `src/generative/OpenAIAgent.js` - OpenAI wrapper for next-token options
- `src/generative/ConversationAgent.ts` - Reference implementation from the final Conversation(A/I)symmetry project (not used, see comments in file)

## Notes

- When using OpenAI, the app creates the client in the browser (`dangerouslyAllowBrowser: true`). For production, route API calls through a backend.
- When using Ollama, ensure the server is running before starting the app.
