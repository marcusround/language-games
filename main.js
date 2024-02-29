import './style.css'
import p5 from 'p5'
import { Sentence } from './src/sentence'
import { Word } from './src/word'
import { Mouth } from './src/mouth'
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

let faceLandmarker;

async function createFaceLandmarker() {
  console.log("Creating FaceLandmarker")
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  console.log("FilesetResolver created")
  const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1
  })
  console.log("FaceLandmarker created")
  return faceLandmarker;
}

createFaceLandmarker().then((fl) => {
  console.log("FaceLandmarker created_after")
  console.log(fl)
  faceLandmarker = fl;
})


new p5(p => {

  // Globals
  const g = {}


  let hasWaited = true;
  // setTimeout(() => {
  //   hasWaited = true;
  // }, 10000)

  let lastVideoTime = 0;

  function doDrawFace() {

    console.log("doDrawFace")

    if (faceLandmarker) {
      console.log("faceLandmarker exists")
    }

    if (faceLandmarker && g.video && g.video.elt && g.video.elt.currentTime !== lastVideoTime) {

      const videoElement = g.video.elt;

      console.log(videoElement.currentTime)
      console.log(g.video)
      const results = faceLandmarker.detectForVideo(videoElement, videoElement.currentTime);
      console.log("Got here")
      lastVideoTime = videoElement.currentTime;
      if (results.faceLandmarks) {
        console.log("Found landmarks")
      }
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

    g.sentence = new Sentence()
    g.words = []

    g.video = p.createCapture(p.VIDEO, () => {

      g.videoScale = Math.max(p.width / g.video.width, p.height / g.video.height)
      g.video.hide()

    });

    // video.size(p.width, p.height);

    // ml5
    //   .facemesh(g.video, () => { console.log('Model is ready!!!') })
    //   .on("face", results => {

    //     g.faces = results

    //     const mouthPoints = results.map(({ annotations }) => {
    //       // Get all mouth points
    //       return [
    //         ...annotations.lipsLowerInner,
    //         ...annotations.lipsUpperInner.reverse()
    //       ]
    //     })
    //     [0] ?? []

    //     mouth.setPoints(mouthPoints)

    //   })


    p.imageMode(p.CENTER)
    p.noFill()
    // p.noStroke()

  }

  p.draw = () => {

    if (p.frameCount % 100 === 0) {

      const nextWord = g.sentence.getNextWord()

      g.words.push(new Word(p, nextWord))

    }

    drawWebcam(p, g)
    mouth.draw(p, g)

    if (hasWaited) {
      doDrawFace()

    }

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

      g.words.splice(i, 1)
      if (mouth.canEatWord(word)) {
        g.words.splice(i, 1)
      }

      p.pop();

    }

  }

})