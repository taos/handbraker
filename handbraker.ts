import * as chokidar from "chokidar";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
const asyncExec = promisify(exec);
import { Queue } from "./queue";

const IN_DIR = "test/input";
const OUT_DIR = "test/output";

const JOB_QUEUE: Queue = new Queue("backlog");
const RUNNING_QUEUE: Queue = new Queue("running");
const DONE: Queue = new Queue("done");
const MAX_JOBS = 1;

export function isVideoFile(filename: string) {
  const videoExtensions = [".mp4", ".mkv", ".avi", ".mov"]; // Add more if needed
  const ext = filename.slice(filename.lastIndexOf("."));
  return videoExtensions.includes(ext.toLowerCase());
}

export function renameFile(filename: string): string {
  let renamed = filename;
  // ex: "The.Mandalorian.S03E01.720p.WEBRip.x264-DocPlexReady.mkv" => "The Mandalorian - S03E01.mkv"
  let regex = /^(.+).+(S\d+E\d+).*\.(.*)$/; // Find tv episodes.
  let match = regex.exec(filename);
  // console.log("match1:", match);
  if (match) {
    const name = match[1].split(".").join(" ");
    return `${name} - ${match?.[2]}.${match?.[3]}`;
  }
  // ex: "Hedwig.And.The.Angry.Inch.2001.1080p.BluRay.x265.mp4" => "Hedwig And The Angry Inch (2001).mp4"
  regex = /^(.+).+(19\d\d|20\d\d).*\.(.*)$/; // Find movies with dates.
  match = regex.exec(filename);
  console.log("match2:", match);
  if (match) {
    const name = match[1].split(".").join(" ");
    const date = match?.[2] ? ` (${match[2]})` : "";
    renamed = `${name}${date}.${match?.[3]}`;
  }
  console.log(renamed);
  return renamed;
}

export async function encodeVideo(
  inputFilePath: string,
  outputFilePath: string
): Promise<string> {
  const format = "Fast 480p30";
  const command = `HandBrakeCLI -i "${inputFilePath}" -o "${outputFilePath}" -Z "${format}"`;
  console.log("Running command: ", command);
  try {
    const { stdout, stderr } = await asyncExec(command);
    console.log(`Successfully encoded ${inputFilePath}: ${stdout}`);
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);
  } catch (e) {
    console.log("error: ", e);
  }
  return "Run completed: " + command;
}

export function parsePath(filepath: string, inDir: string, outDir: string) {
  const filename = path.basename(filepath);
  const dir = path.dirname(filepath);
  // In: inputDir + extraPath + filename
  // Out: outDir +  extraPath
  const diff = dir.replace(inDir, "");
  const outPath = path.join(outDir, diff);
  return [filename, outPath]; // , outPath];
}

function addFile(filepath: string) {
  JOB_QUEUE.push(filepath);
  checkToRun();
}

function checkToRun() {
  console.log(
    `checkToRun: ${RUNNING_QUEUE.size()} < ${MAX_JOBS}: ${
      RUNNING_QUEUE.size() < MAX_JOBS
    }`
  );
  if (RUNNING_QUEUE.size() < MAX_JOBS) {
    const fileToRun = JOB_QUEUE.shift();
    if (fileToRun) {
      processFile(fileToRun);
    }
  }
}

async function processFile(filepath: string) {
  console.log(`File Added: ${filepath}`);
  // Step 1: Is this a file we care about?
  if (isVideoFile(filepath)) {
    RUNNING_QUEUE.push(filepath);
    console.log(`push: in_progress: ${RUNNING_QUEUE.items()}`);
    // Step 2: If so, replicate its directory structure in output directory
    const [filename, outDir] = parsePath(filepath, IN_DIR, OUT_DIR);
    console.log("Creating directory: ", outDir);
    fs.mkdirSync(outDir, { recursive: true });
    // Step 3: copy it to working directory, with new name
    //    HandBrakeCLI -i source -o destination
    const renamed = renameFile(filename);
    const outPath = path.join(outDir, renamed);
    await encodeVideo(filepath, outPath);
    RUNNING_QUEUE.delete(filepath);
    DONE.push(filepath);
    console.log(`pop: in_progress: ${RUNNING_QUEUE.items()}`);
  } else {
    console.log("Not a video file: ", filepath);
  }
  checkToRun();
}

function addDir(dirPath: string) {
  const files = fs.readdirSync(dirPath, { recursive: true });
  for (const file of files) {
    addFile(file.toString());
  }
}

export function watch() {
  console.log("Setting up watcher on :", IN_DIR);
  const watcher = chokidar.watch(IN_DIR, {
    persistent: true, // Keep the service running
    awaitWriteFinish: true, // Wait until file has stopped growing for 2 seconds
    ignoreInitial: true, // Ignore files already in the directory.
  });

  watcher.on("add", (path) => {
    console.log("Added: ", path);
    addFile(path);
  });
  watcher.on("addDir", (path) => {
    console.log("addDir: ", path);
    addDir(path);
  });
  watcher.on("change", (path) => {
    console.log("\n\nChanged: ", path);
    addFile(path);
  });

  // Clear the running queue
  RUNNING_QUEUE.reset();
  DONE.reset();

  // Restart any jobs in backlog
  const jobs = JOB_QUEUE.items();
  for (const job of jobs) {
    addFile(job);
  }
}

export function getQueueStats() {
  return {
    backlog: JOB_QUEUE.size(),
    job_queue: JOB_QUEUE.items(),
    running: RUNNING_QUEUE.size(),
    running_queue: RUNNING_QUEUE.items(),
    done: DONE.size(),
    done_queue: DONE.items(),
  };
}
