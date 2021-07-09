import Control from "../utilities/control";
import timerStyles from './timer.module.css';

class Timer extends Control {
  private counter = 0;

  private count = 10;

  private time: number;

  private startTime = 0;

  private isPlaying = false;

  constructor(parentNode: HTMLElement) {
    super(parentNode, 'div', timerStyles.cross_timer);
    this.node.textContent = '00:10';
  }

  start() {
    this.isPlaying = true;
    this.node.textContent = '00:00';
    this.counter = window.setInterval(() => {
      this.time = Math.floor((Date.now() - this.startTime) / 1000);
      this.node.textContent = this.getTimeString();
    }, 1000);
  }

  clear() {
    if (this.counter) {
      window.clearInterval(this.counter);
      this.counter = 0;
      this.node.textContent = '00:00';
      this.startTime += 11000;
    }
  }

  countDown() {
    this.counter = window.setInterval(() => {
      if (this.count - this.time === 0) {
        this.clear();
        this.start();
        this.isPlaying = true;
      } else {
        this.time = Math.floor((Date.now() - this.startTime) / 1000);
        this.node.textContent = this.getCountDownString();
      }
    }, 1000);
  }

  setTimer(startTime: number) {
    this.startTime = startTime;
    this.time = startTime;
    this.start();
    // this.countDown();
  }

  getCountDownString(): string {
    const seconds = Math.floor((this.count - this.time) % 60);

    const secOutput = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `00:${secOutput}`;
  }

  getTimeString(): string {
    const minutes = Math.floor(this.time / 60);
    const seconds = Math.floor(this.time % 60);

    const minOutput = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secOutput = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minOutput}:${secOutput}`;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  stop(): void {
    window.clearInterval(this.counter);
  }
}

export default Timer;
