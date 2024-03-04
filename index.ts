import chokidar from "chokidar";
import { exec } from "child_process";

// add test/library1/foo.bar
// change test/library1/foo.bar
// unlink test/library1/foo.bar
// chokidar.watch('./test/library1').on('all', (event, path) => {
//     console.log(event, path);
// });

const directoryToMonitor = "./test/library1";

export function isVideoFile(filename) {
  const videoExtensions = [".mp4", ".mkv", ".avi", ".mov"]; // Add more if needed
  const ext = filename.slice(filename.lastIndexOf("."));
  return videoExtensions.includes(ext.toLowerCase());
}

export function encodeVideo(filename) {
  console.log("one");
  exec("echo 'hi tao'", () => {});
  // const inputFilePath = `${directoryToMonitor}/${filename}`;
  // const outputFilePath = `${directoryToMonitor}/encoded_${filename}`;
  // const command = `HandBrakeCLI -i "${inputFilePath}" -o "${outputFilePath}"`;

  // exec(command, (error, stdout, stderr) => {
  //     if (error) {
  //         console.error(`Error encoding ${filename}: ${error.message}`);
  //         return;
  //     }
  //     if (stderr) {
  //         console.error(`Error encoding ${filename}: ${stderr}`);
  //         return;
  //     }
  //     console.log(`Successfully encoded ${filename}`);
  // });
}

function main() {
  const watcher = chokidar.watch("./test/library1", {
    // persistent: true,
    awaitWriteFinish: true,
  });

  watcher.on("add", (path) => {
    add_file(path);
  });

  function add_file(path) {
    console.log(`File Added: ${path}`);
    // Step 1: Is this a file we care about?

    // Step 2: If so, replicate it's directory structure in output directory

    // Work out new name:

    // Step 3: copy it to working directory, with new name
    //    HandBrakeCLI -i source -o destination
  }
}
