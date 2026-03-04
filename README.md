# Machine Vision Word-Eating Sketch

A creative coding experiment built with **Vite + p5.js + MediaPipe Face Landmarker + OpenAI**.

The sketch uses your webcam to track mouth landmarks in real time. Generated words move across the screen, and words that enter the mouth region are "eaten" and appended to an evolving sentence.

## Features

- Real-time webcam capture in p5.js
- Face/mouth landmark detection with MediaPipe Tasks Vision
- Bounding-box mouth collision against animated words
- Token suggestion loop using OpenAI chat completions

## Tech Stack

- Vite
- p5.js
- @mediapipe/tasks-vision
- OpenAI JavaScript SDK

## Prerequisites

- Node.js 18+
- A webcam
- An OpenAI API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
VITE_OPENAI_API_KEY=your_api_key_here
```

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
- `src/generative/Agent.js` - OpenAI wrapper for next-token options

## Notes

- The app currently creates the OpenAI client in the browser (`dangerouslyAllowBrowser: true`). For production, route API calls through a backend.
- The model in `src/generative/Agent.js` may need updating if it is no longer available.
