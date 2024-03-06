import chokidar from "chokidar";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

// add test/library1/foo.bar
// change test/library1/foo.bar
// unlink test/library1/foo.bar
// chokidar.watch('./test/library1').on('all', (event, path) => {
//     console.log(event, path);
// });

const IN_DIR = "test/library1";
const OUT_DIR = "test/output";

export function isVideoFile(filename: string) {
  const videoExtensions = [".mp4", ".mkv", ".avi", ".mov"]; // Add more if needed
  const ext = filename.slice(filename.lastIndexOf("."));
  return videoExtensions.includes(ext.toLowerCase());
}

export function rename(filename: string): string {
  let renamed = filename;
  // ex: "The.Mandalorian.S03E01.720p.WEBRip.x264-DocPlexReady.mkv" => "The Mandalorian - S03E01.mkv"
  let regex = /^(.+).+(S\d+E\d+).*\.(.*)$/; // Find tv episodes.
  let match = regex.exec(filename);
  console.log("match1:", match);
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

export function encodeVideo(inputFilePath: string, outputFilePath: string) {
  // console.log("one");
  // exec(`echo 'hi tao ${filename}'`, () => {});
  // const inputFilePath = `${IN_DIR}/${filename}`;
  // const outputFilePath = `${IN_DIR}/encoded_${filename}`;
  const format = "Fast 480p30";
  const command = `HandBrakeCLI -i "${inputFilePath}" -o "${outputFilePath}" -Z "${format}"`;
  console.log("Running command: ", command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error encoding ${inputFilePath}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error encoding ${inputFilePath}: ${stderr}`);
      return;
    }
    console.log(`Successfully encoded ${inputFilePath}: ${stdout}`);
  });
}

export function parsePath(filepath: string) {
  const filename = path.basename(filepath);
  const dir = path.dirname(filepath);
  // In: inputDir + extraPath + filename
  // Out: outDir +  extraPath
  const diff = dir.replace(IN_DIR, "");
  const outDir = path.join(OUT_DIR, diff);
  // const outPath = `${outDir}/${filename}`;
  return [filename, outDir]; // , outPath];
}

function addFile(filepath: string) {
  console.log(`File Added: ${filepath}`);
  // Step 1: Is this a file we care about?
  if (isVideoFile(filepath)) {
    // Step 2: If so, replicate its directory structure in output directory
    const [filename, outDir] = parsePath(filepath);
    console.log("Creating directory: ", outDir);
    fs.mkdirSync(outDir, { recursive: true });
    // Step 3: copy it to working directory, with new name
    //    HandBrakeCLI -i source -o destination
    const renamed = rename(filename);
    const outPath = path.join(outDir, renamed);
    encodeVideo(filepath, outPath);
  }
}

function main() {
  console.log("Setting up watcher on :", IN_DIR);
  const watcher = chokidar.watch(IN_DIR, {
    persistent: true, // Keep the service running
    awaitWriteFinish: true, // Wait until file has stopped growing for 2 seconds
    ignoreInitial: true, // Ignore files already in the directory.
  });

  watcher.on("add", (path) => {
    addFile(path);
  });
}

if (process.env.NODE_ENV !== "test") {
  main();
}

// console.log("process.env", process.env);
