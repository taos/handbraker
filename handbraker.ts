import * as chokidar from "chokidar";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
const asyncExec = promisify(exec);
import { Queue } from "./queue";

import Debug from "debug";
const log = Debug("handbraker:main");

// const IN_DIR = "test/input";
// const OUT_DIR = "test/output";
// const MAX_JOBS = 1;

// export type Options = Record<string, string>;
export interface Configs {
  inputFolder: string;
  outputFolder: string;
  maxJobs: number;
  params: string;
}

const JOB_QUEUE: Queue = new Queue("backlog");
const RUNNING_QUEUE: Queue = new Queue("running");
const DONE: Queue = new Queue("done");
const FAILED: Queue = new Queue("failed");

export function isVideoFile(filename: string) {
  const videoExtensions = [".mp4", ".mkv", ".avi", ".mov"]; // Add more if needed
  const ext = filename.slice(filename.lastIndexOf("."));
  return videoExtensions.includes(ext.toLowerCase());
}

export function renameFile(filename: string): string {
  // TV episode:
  // ex: "The.Mandalorian.S03E01.720p.WEBRip.x264-DocPlexReady.mkv" => "The Mandalorian - S03E01.mkv"
  let regex = /^(.+).+(S\d+E\d+).*\.(.*)$/; // Find tv episodes.
  let match = regex.exec(filename);
  if (match) {
    const name = match[1].split(".").join(" ");
    const renamed = `${name} - ${match?.[2]}.${match?.[3]}`;
    log("Matched an episode. New name:", renamed);
    return renamed;
  }
  // Movie:
  // ex: "Hedwig.And.The.Angry.Inch.2001.1080p.BluRay.x265.mp4" => "Hedwig And The Angry Inch (2001).mp4"
  regex = /^(.+).+(19\d\d|20\d\d).*\.(.*)$/; // Find movies with dates.
  match = regex.exec(filename);
  if (match) {
    const name = match[1].split(".").join(" ");
    const date = match?.[2] ? ` (${match[2]})` : "";
    const renamed = `${name}${date}.${match?.[3]}`;
    log("Matched a movie. New name:", renamed);
    return renamed;
  }
  log("No match on:", filename);
  return filename;
}

export async function encodeVideo(
  inputFilePath: string,
  outputFilePath: string,
  handbrakeFormat: string
): Promise<boolean> {
  const command = `HandBrakeCLI -i "${inputFilePath}" -o "${outputFilePath}" -Z "${handbrakeFormat}"`;
  console.log("Running command: ", command);
  try {
    const { stdout, stderr } = await asyncExec(command);
    console.log(`Successfully encoded ${inputFilePath}: ${stdout}`);
    console.log("Handbrake stdout:", stdout);
    console.error("Handbrake stderr:", stderr);
  } catch (e) {
    console.error("Handbrake Error: \n", e);
    return false;
  }
  return true;
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

function addFile(filepath: string, configs: Configs) {
  console.log("Adding file to the job queue for processing: ", filepath);
  JOB_QUEUE.push(filepath);
  checkToRun(configs);
}

function checkToRun(configs: Configs) {
  const maxJobs = configs.maxJobs;
  log(
    `checkToRun: ${RUNNING_QUEUE.size()} < ${maxJobs}: ${
      RUNNING_QUEUE.size() < maxJobs
    }`
  );
  if (RUNNING_QUEUE.size() < maxJobs) {
    const fileToRun = JOB_QUEUE.shift();
    if (fileToRun) {
      processFile(fileToRun, configs);
    }
  }
}

async function processFile(filepath: string, configs: Configs) {
  console.log(`Processing File: ${filepath}`);
  // Step 1: Is this a file we care about?
  if (isVideoFile(filepath)) {
    RUNNING_QUEUE.push(filepath);
    // Step 2: If so, replicate its directory structure in output directory
    const [filename, outDir] = parsePath(
      filepath,
      configs.inputFolder,
      configs.outputFolder
    );
    log("Creating directory: ", outDir);
    fs.mkdirSync(outDir, { recursive: true });
    // Step 3: copy it to working directory, with new name
    //    HandBrakeCLI -i source -o destination
    const renamed = renameFile(filename);
    const outPath = path.join(outDir, renamed);
    const success = await encodeVideo(filepath, outPath, configs.params);
    RUNNING_QUEUE.delete(filepath);
    if (success) {
      console.log(`Done with: ${filepath}`);
      DONE.push(filepath);
    } else {
      console.log(`${filepath} failed`);
      FAILED.push(filepath);
    }
    console.log(getQueueStats());
  } else {
    log("Not a video file: ", filepath);
  }
  checkToRun(configs);
}

function addDir(dirPath: string, configs: Configs) {
  const files: string[] = fs.readdirSync(dirPath, {
    recursive: true,
    encoding: "utf8",
  });
  for (const file of files) {
    const filepath = path.join(dirPath, file);
    log("Adding File from directory:", filepath);
    addFile(filepath, configs);
  }
}

export function watch(configs: Configs) {
  console.log("Setting up watcher on :", configs.inputFolder);
  const watcher = chokidar.watch(configs.inputFolder, {
    persistent: true, // Keep the service running
    awaitWriteFinish: true, // Wait until file has stopped growing for 2 seconds
    ignoreInitial: true, // Ignore files already in the directory.
  });

  watcher.on("add", (path) => {
    log("Added: ", path);
    addFile(path, configs);
  });
  watcher.on("addDir", (path) => {
    log("addDir: ", path);
    addDir(path, configs);
  });
  watcher.on("change", (path) => {
    log("\n\nChanged: ", path);
    addFile(path, configs);
  });

  // Clear the queues
  RUNNING_QUEUE.reset();
  DONE.reset();
  FAILED.reset();

  // Restart any jobs in backlog
  const jobs = JOB_QUEUE.items();
  for (const job of jobs) {
    addFile(job, configs);
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
    failed: FAILED.size(),
    failed_queue: FAILED.items(),
  };
}
