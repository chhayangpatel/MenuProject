/**
 * Text scramble effect for headings.
 * Letters shuffle through random characters before settling.
 */
const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export class TextScramble {
  el: HTMLElement;
  finalText: string = '';
  frame: number = 0;
  frameRequest: number = 0;
  queue: { from: string; to: string; start: number; end: number }[] = [];

  constructor(el: HTMLElement) {
    this.el = el;
  }

  setText(newText: string) {
    const oldText = this.el.textContent || '';
    this.finalText = newText;
    const length = Math.max(oldText.length, newText.length);
    this.queue = [];

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
  }

  update() {
    let output = '';
    let complete = 0;

    for (let i = 0; i < this.queue.length; i++) {
      const { from, to, start, end } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        output += CHARS[Math.floor(Math.random() * CHARS.length)];
      } else {
        output += from;
      }
    }

    this.el.textContent = output;

    if (complete === this.queue.length) {
      this.el.textContent = this.finalText;
      return;
    }

    this.frameRequest = requestAnimationFrame(() => {
      this.frame++;
      this.update();
    });
  }
}
