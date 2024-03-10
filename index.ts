import { watch, getQueueStats } from "./handbraker";

import { program } from "commander";
program.version("1.0.0", "-v, --version").usage("[OPTIONS]...");

program
  .command("watch")
  .description("Watch the input directory")
  .action(() => {
    console.log("Watch command called");
    watch();
  });

program
  .command("status", { isDefault: true })
  .description("Get run status")
  .action(() => {
    console.log("Status command called", getQueueStats());
  });

program.parse(process.argv);
const options = program.opts();
