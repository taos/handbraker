import { watch, getQueueStats, Configs } from "./handbraker";

import * as toml from "toml";
import * as fs from "fs";
import { Command } from "commander";

const program = new Command();

program
  .name("Handbraker")
  .description("Add a watch folder to handbrake")
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...");
// .option(
//   "-f, --config_file [path]",
//   "Config File in TOML format",
//   "handbraker.config.toml"
// );

// program.on("option:config_file", () => {
//   console.log("Setup configs");
// });

program
  .command("watch")
  .description("Watch the input directory")
  .option(
    "-f, --config_file [path]",
    "Config File, in TOML format.",
    "handbraker.config.toml"
  )
  .option("-i, --input_folder [path]", "Folder to watch for incoming files.")
  .option("-o, --output_folder [path]", "Folder to write to.")
  .option("-m, --max [int]", "Max number of jobs to run at once.", "1")
  .option("-p, --handbrake [params]", "Parameters to pass to handbrake-cli.")
  .action((opts) => {
    console.log("Watch command called");
    console.log("Looking for config file: ", opts.config_file);
    let fileConfigs: Configs = {};
    if (opts.config_file) {
      fileConfigs = toml.parse(fs.readFileSync(opts.config_file, "utf-8"));
      console.log("fileConfigs:", fileConfigs);
    }
    const configs: Configs = {};
    configs["input_folder"] =
      opts.input_folder ?? fileConfigs.input_folder ?? "watch";
    configs["output_folder"] =
      opts.output_folder ?? fileConfigs.output_folder ?? "output";
    configs["max_jobs"] = opts.max_jobs ?? fileConfigs.max_jobs ?? "1"; // TODO -- convert to int.
    configs["handbrake"] =
      opts.handbrake ?? fileConfigs.handbrake ?? "Fast 480p30";
    console.log("configs:", configs);
    watch(configs);
  });

program
  .command("status", { isDefault: true })
  .description("Get run status")
  .action(() => {
    console.log("Status command called", getQueueStats());
  });

program.parse(process.argv);
// const options = program.opts();
// console.log(options);
