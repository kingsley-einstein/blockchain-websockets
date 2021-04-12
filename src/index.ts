import express from "express";
import debug from "debug";
import chalk from "chalk";

const log = debug("root");
const port: number = parseInt(process.env.PORT || "9000");
const app: express.Application = express();

app.listen(port, () =>
  log(chalk.yellow(`Blockchain server is running on port ${port}`))
);
