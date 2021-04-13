"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
exports.__esModule = true;
exports.Ops = void 0;
var crypto_1 = require("../helpers/crypto");
var Message_1 = require("../interfaces/Message");
var miner_1 = require("./miner");
var Ops = /** @class */ (function () {
  function Ops() {}
  Ops.generatePair = function (req, res) {
    try {
      var pair = crypto_1.generateAccount(req.body.passphrase);
      return res.status(201).json(__assign({}, pair));
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  };
  Ops.createAndSignTransaction = function (req, res) {
    try {
      var transactions = miner_1.chain.signTransaction(
        __assign(__assign({}, req.body.transaction), { timestamp: Date.now() }),
        req.body.pk
      );
      for (
        var _i = 0, transactions_1 = transactions;
        _i < transactions_1.length;
        _i++
      ) {
        var transaction = transactions_1[_i];
        miner_1.chain.addTransactionToPool(transaction);
        miner_1.p2p.broadcast({
          type: Message_1.MessageType.TRANSACTION,
          body: transaction
        });
      }
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  };
  Ops.requestChain = function (req, res) {
    try {
      return res.status(200).json(miner_1.chain.getChain());
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  };
  Ops.requestPendingTransactions = function (req, res) {
    try {
      return res.status(200).json(miner_1.chain.getPendingTransactions());
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  };
  return Ops;
})();
exports.Ops = Ops;
