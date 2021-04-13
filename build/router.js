"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var operations_1 = require("./main/operations");
var router = express_1["default"].Router();
router.post("/account", operations_1.Ops.generatePair);
router.post("/transaction", operations_1.Ops.createAndSignTransaction);
router.get("/chain", operations_1.Ops.requestChain);
router.get("/pending", operations_1.Ops.requestPendingTransactions);
exports["default"] = router;
