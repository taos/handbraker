/**
 * Super simple persistant queue, backed by a json file writen to disk.
 */
import * as fs from "fs";
import * as path from "path";
import Debug from "debug";
const log = Debug("handbraker:queue");

export class Queue {
  private filePath: string;

  /**
   * @param name -- name of the queue
   * @param reset -- clear the queue if it already contains data.
   * @param folder -- where to store the queue
   */
  constructor(
    name: string = "queue",
    reset: boolean = false,
    folder: string = "queues"
  ) {
    this.filePath = path.join(folder, `${name}.json`);
    fs.mkdirSync(folder, { recursive: true });
    if (reset) {
      this.reset();
    }
  }
  close(): void {
    fs.rmSync(this.filePath);
  }
  reset(): void {
    this.save([]);
  }
  items(): string[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const data = fs.readFileSync(this.filePath, "utf8");
    return JSON.parse(data) || [];
  }
  private save(queue: string[]): void {
    log(`Save ${queue} to ${this.filePath}`);
    fs.writeFileSync(this.filePath, JSON.stringify(queue, null, 2), "utf8"); // write it back
  }
  size(): number {
    return this.items().length;
  }
  push(item: string) {
    log(`push "${item}" into "${this.filePath}"`);
    const queue = this.items();
    queue.push(item); // Add some data
    this.save(queue);
  }
  delete(item: string): void {
    const queue = this.items();
    this.remove(queue.indexOf(item));
  }
  private remove(i: number): string {
    const queue = this.items();
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
    return this.items()[0];
  }
  shift(): string {
    return this.remove(this.size() - 1);
  }
}
