import fs from "fs";
import path from "path";

export class Queue {
  dir: string;

  constructor(name: string) {
    this.dir = `queues/${name}`;
    fs.mkdirSync(this.dir, { recursive: true });
  }

  clean(): void {
    fs.rmSync(this.dir, { force: true, recursive: true });
    fs.mkdirSync(this.dir, { recursive: true });
  }

  // Get files, sorted by last modified time.
  all(): string[] {
    const files = fs.readdirSync(this.dir);
    return files
      .map((fileName) => ({
        name: fileName,
        time: fs.statSync(path.join(this.dir, fileName)).mtimeMs,
      }))
      .sort((a, b) => a.time - b.time)
      .map((file) => file.name);
  }

  size(): number {
    return fs.readdirSync(this.dir).length;
  }

  push(item: string): void {
    const itemPath = path.join(this.dir, item);
    fs.writeFileSync(itemPath, "");
  }

  remove(i: number): string {
    const items = this.all();
    if (i < 0 || i >= items.length) {
      return "";
    }
    const item = items[i];
    const itemPath = path.join(this.dir, item);
    fs.rmSync(itemPath);
    return item;
  }

  pop(): string {
    return this.remove(0);
  }
  shift(): string {
    return this.remove(this.size() - 1);
  }
}
