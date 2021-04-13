"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var debug_1 = __importDefault(require("debug"));
var chalk_1 = __importDefault(require("chalk"));
var router_1 = __importDefault(require("./router"));
var miner_1 = require("./main/miner");
var log = debug_1["default"]("root");
var port = parseInt(process.env.PORT || "9000");
var app = express_1["default"]();
app.use(express_1["default"].json());
app.use(router_1["default"]);
app.listen(port, function () {
  log(
    chalk_1["default"].yellow("Blockchain server is running on port " + port)
  );
  miner_1.p2p.listen();
  miner_1.p2p.connectToPeers();
  miner_1.p2p.mineBlocks();
  miner_1.p2p.checkValidity();
});
