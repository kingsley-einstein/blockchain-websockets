import express from "express";
import debug from "debug";
import chalk from "chalk";
import router from "./router";
import { p2p } from "./main/miner";

const log = debug("root");
const port: number = parseInt(process.env.PORT || "9000");
const app: express.Application = express();

app.use(express.json());
app.use(router);

app.listen(port, () => {
  log(chalk.yellow(`Blockchain server is running on port ${port}`));
  p2p.listen();
  p2p.connectToPeers();
  p2p.mineBlocks();
  p2p.checkValidity();
});
