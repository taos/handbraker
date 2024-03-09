/**
 * Super simple persistant queue, backed by a json file writen to disk.
 */
import fs from "fs";
import path from "path";

export class Queue {
  private filePath: string;

  constructor(name: string = "queue", folder: string = "queues") {
    this.filePath = path.join(folder, `${name}.json`);
    fs.mkdirSync(folder, { recursive: true });
    this.open();
  }
  open(): void {
    fs.writeFileSync(this.filePath, JSON.stringify([]), "utf8");
  }
  close(): void {
    fs.rmSync(this.filePath);
  }
  clean(): void {
    this.save([]);
  }
  private load(): string[] {
    const data = fs.readFileSync(this.filePath, "utf8");
    return JSON.parse(data) || [];
  }
  private save(queue: string[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(queue), "utf8"); // write it back
  }
  size(): number {
    return this.load().length;
  }
  push(item: string) {
    console.log(`push "${item}" into "${this.filePath}"`);
    const queue = this.load();
    queue.push(item); // Add some data
    this.save(queue);
  }
  private remove(i: number): string {
    const queue = this.load();
    if (i < 0 || i >= queue.length) {
      return "";
    }
    const item = queue[i];
    queue.splice(i, 1);
    this.save(queue);
    return item;
  }
  pop(): string {
    return this.remove(0);
  }
  peek(): string {
    return this.load()[0];
  }
  shift(): string {
    return this.remove(this.size() - 1);
  }
}
