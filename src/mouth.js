export class Mouth {

  constructor(p, g) {

    this.points = []

    this.p = p
    this.g = g

    this.boundingBox = {
      top: Infinity,
      left: Infinity,
      bottom: -Infinity,
      right: -Infinity
    }

  }

  mapWebcamPointToCanvasPoint([_x, _y]) {

    let yOffset = 0;
    // let yOffset = -0.11;

    const x = _x * this.g.video.width * this.g.videoScale
    const y = (_y + yOffset) * this.g.video.height * this.g.videoScale

    return [x, y]

  }

  setPoints(points) {

    this.points.length = 0
    this.boundingBox = {
      top: Infinity,
      left: Infinity,
      bottom: -Infinity,
      right: -Infinity
    }

    for (const { x: _x, y: _y } of points) {

      const [x, y] = this.mapWebcamPointToCanvasPoint([_x, _y])

      this.points.push([x, y])

      if (x < this.boundingBox.left) {
        this.boundingBox.left = x
      }

      if (x > this.boundingBox.right) {
        this.boundingBox.right = x
      }

      if (y < this.boundingBox.top) {
        this.boundingBox.top = y
      }

      if (y > this.boundingBox.bottom) {
        this.boundingBox.bottom = y
      }

    }

  }

  draw(p, g) {

    p.push()

    p.strokeWeight(2)
    p.stroke(255, 255, 0)
    p.rectMode(p.CORNERS)
    p.rect(this.boundingBox.left, this.boundingBox.top, this.boundingBox.right, this.boundingBox.bottom)

    p.beginShape()

    p.noFill()
    p.stroke(255, 0, 0)
    p.strokeWeight(4)

    for (const [x, y] of this.points) {

      p.vertex(x, y);

    }

    p.endShape(p.CLOSE)


    p.pop()

  }

  canEatWord(word, offset) {

    const offsetY = (word.position.y + offset) % this.p.height

    return (
      word.position.x > this.boundingBox.left &&
      word.position.x < this.boundingBox.right &&
      offsetY > this.boundingBox.top &&
      offsetY < this.boundingBox.bottom
    )

  }

}