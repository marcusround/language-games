import './style.css'
import p5 from 'p5'
import { Sentence } from './src/sentence'
import { Word } from './src/word'
import { Mouth } from './src/mouth'
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import OpenAI from "openai"

let faceLandmarker;

async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1
  })
  return faceLandmarker;
}

// I had to manually check these T_T
const innerMouthIndices = [13, 82, 81, 80, 191, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312]
const outerMouthIndices = [0, 37, 39, 40, 185, 62, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267]

createFaceLandmarker().then((fl) => {
  console.log(fl)
  faceLandmarker = fl;
})

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

new p5(p => {

  // Globals
  const g = {}

  let lastVideoTime = 0;

  function updateResults() {

    if (faceLandmarker && g.video && g.video.elt && g.video.elt.currentTime !== lastVideoTime) {

      const videoElement = g.video.elt;

      const results = faceLandmarker.detectForVideo(videoElement, videoElement.currentTime * 1000);
      lastVideoTime = videoElement.currentTime

      g.results = results;

      if (results && results.faceLandmarks.length !== 0) {

        const mouthPointsInner = innerMouthIndices.map(i => results.faceLandmarks[0][i])
        mouth.setPoints(mouthPointsInner)

        return

      } else {
        mouth.setPoints([])
      }

    }

  }

  function doDrawFace() {

    if (g.results) {

      if (g.results.faceLandmarks.length === 0) {
        return
      }

      p.push()
      p.noStroke()
      p.fill('red')
      for (let i = 0; i < g.results.faceLandmarks[0].length; i++) {

        let { x, y } = g.results.faceLandmarks[0][i]

        // I don't know why this be like it is but it do
        y -= 0.11

        x *= g.video.width * g.videoScale
        y *= g.video.height * g.videoScale

        // p.text(i, x, y)

      }
      p.pop()

      p.push()
      p.noFill()
      p.stroke('white')
      p.beginShape()

      for (const i of innerMouthIndices) {
        p.vertex(
          g.results.faceLandmarks[0][i].x * g.video.width * g.videoScale,
          (g.results.faceLandmarks[0][i].y - 0.11) * g.video.height * g.videoScale
        )

      }

      p.endShape(p.CLOSE)

      p.push()
      p.noFill()
      p.stroke('white')
      p.beginShape()

      for (const i of outerMouthIndices) {
        p.vertex(
          g.results.faceLandmarks[0][i].x * g.video.width * g.videoScale,
          (g.results.faceLandmarks[0][i].y - 0.11) * g.video.height * g.videoScale
        )

      }

      p.endShape(p.CLOSE)

    }

  }

  const mouth = new Mouth(p, g)

  const drawWebcam = (p, g) => {

    p.push()

    p.translate(p.width / 2, p.height / 2)

    p.image(
      g.video,
      0, 0,
      g.video.width * g.videoScale,
      g.video.height * g.videoScale
    );

    p.pop()

  }

  p.setup = () => {

    const cnv = p.createCanvas(window.innerWidth, window.innerHeight)
    cnv.parent('app')

    g.faces = []

    g.sentence = new Sentence(openai)
    g.sentence.updateOptions()
    g.words = []

    g.video = p.createCapture(p.VIDEO, () => {

      g.videoScale = Math.max(p.width / g.video.width, p.height / g.video.height)
      g.video.hide()

    });

    p.imageMode(p.CENTER)
    p.noFill()

  }

  p.draw = () => {

    if (p.frameCount % 100 === 0) {

      const nextWord = g.sentence.getNextWord()

      g.words.push(new Word(p, nextWord))

    }

    drawWebcam(p, g)
    mouth.draw(p, g)

    updateResults()
    doDrawFace()

    for (let i = g.words.length - 1; i >= 0; i--) {

      const word = g.words[i]

      p.push();
      p.fill(255);
      p.noStroke();
      p.textSize(32);
      p.textAlign(p.CENTER, p.CENTER); 2

      word.update();
      word.draw();

      if (word.x < 0) {
        g.words.splice(i, 1)
      }

      if (mouth.canEatWord(word)) {
        g.words.splice(i, 1)
        g.sentence.addWord(word.word)
      }

      p.pop();

    }

    p.push()
    p.fill('red')
    p.textSize(24)
    p.text(g.sentence.toString(), 25, 25)
    p.pop()

  }


})