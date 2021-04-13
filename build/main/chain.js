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
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
exports.__esModule = true;
exports.BlockChain = void 0;
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var chalk_1 = __importDefault(require("chalk"));
var crypto_1 = require("../helpers/crypto");
var constants_1 = require("./constants");
var log = debug_1["default"]("chain");
var BlockChain = /** @class */ (function () {
  function BlockChain() {
    this.chain = [];
    this.transactionPool = [];
    this.coinbase = "";
    this.coinbase = process.env.COINBASE
      ? process.env.COINBASE
      : process.env.PASSPHRASE
      ? crypto_1.generateAccount(process.env.PASSPHRASE).address
      : crypto_1.generateRandom().address;
    this.chain = [this.genesisBlock()];
  }
  BlockChain.prototype.genesisBlock = function () {
    var block = {
      index: 1,
      hash: "",
      previousHash: "0000",
      timestamp: Date.now(),
      nonce: constants_1.Constants.NONCE,
      difficulty: constants_1.Constants.DIFFICULTY,
      data: [],
      merkleRoot: ""
    };
    return crypto_1.calculateBlockHash(block);
  };
  BlockChain.prototype.getLastBlock = function () {
    return lodash_1["default"].last(this.chain);
  };
  BlockChain.prototype.adjustDifficulty = function (lastBlock, currentTime) {
    var difficulty = lastBlock.difficulty;
    return lastBlock.timestamp + constants_1.Constants.MINING_RATE > currentTime
      ? difficulty + 1
      : difficulty - 1;
  };
  BlockChain.prototype.signTransaction = function (txn, pk) {
    var transaction = null;
    if (typeof txn === "string") {
      transaction = JSON.parse(Buffer.from(txn, "hex").toString());
    } else {
      transaction = __assign({}, txn);
    }
    var hashedTx = crypto_1.calculateTransactionHash(transaction);
    var signedHashedTx = crypto_1.signTransaction(hashedTx, pk);
    var coinbaseTransaction = {
      sender: "",
      recipient: this.coinbase,
      amount:
        constants_1.Constants.FEE_PER_BYTES *
        crypto_1.calculateBytes(signedHashedTx),
      coinbaseAddress: this.coinbase,
      isCoinbase: true,
      hash: "",
      signature: "",
      timestamp: Date.now()
    };
    return [
      signedHashedTx,
      crypto_1.signTransaction(
        crypto_1.calculateTransactionHash(coinbaseTransaction),
        pk
      )
    ];
  };
  BlockChain.prototype.addTransactionToPool = function (txn) {
    this.transactionPool = lodash_1["default"].concat(
      this.transactionPool,
      txn
    );
    log(chalk_1["default"].blue("Adding new transaction to pool: " + txn.hash));
    return lodash_1["default"].find(
      this.transactionPool,
      function (transaction) {
        return transaction.hash === txn.hash;
      }
    );
  };
  BlockChain.prototype.addBlock = function (block) {
    this.chain = lodash_1["default"].concat(this.chain, block);
    log(chalk_1["default"].blue("Added new block to chain"));
  };
  BlockChain.prototype.mineBlock = function () {
    var lastBlock = this.getLastBlock();
    log(
      chalk_1["default"].blue(
        "Mining new block from ancestor: " + lastBlock.hash
      )
    );
    var iteration = 0;
    var block = {
      index: lastBlock.index + 1,
      timestamp: Date.now(),
      nonce: constants_1.Constants.NONCE,
      difficulty: constants_1.Constants.DIFFICULTY,
      hash: "",
      previousHash: lastBlock.hash,
      data: this.transactionPool,
      merkleRoot: crypto_1.calculateMerkleRoot(this.transactionPool)
    };
    do {
      iteration++;
      log(chalk_1["default"].yellow("Running PoW on iteration: " + iteration));
      var currentTime = Date.now();
      block.nonce = block.nonce + 1;
      block.difficulty = this.adjustDifficulty(lastBlock, currentTime);
      block.timestamp = currentTime;
      block = crypto_1.calculateBlockHash(block);
    } while (
      !lodash_1["default"].isEqual(
        block.hash.substring(0, block.difficulty),
        "0".repeat(block.difficulty)
      )
    );
    this.addBlock(block);
    this.transactionPool = [];
    return block;
  };
  BlockChain.prototype.isChainValid = function () {
    log(chalk_1["default"].blue("Now checking chain validity"));
    var _loop_1 = function (i) {
      var currentBlock = lodash_1["default"].get(this_1.chain, i);
      var previousBlock = lodash_1["default"].find(
        this_1.chain,
        function (block) {
          return lodash_1["default"].isEqual(
            block.index,
            currentBlock.index - 1
          );
        }
      );
      log(chalk_1["default"].blue("Running check for => ", currentBlock.hash));
      if (
        !lodash_1["default"].isEqual(
          currentBlock.previousHash,
          previousBlock.hash
        )
      ) {
        log(
          chalk_1["default"].red(
            "Chain is invalid at this point. Faulty block at index: " +
              currentBlock.index
          )
        );
        return { value: false };
      }
      if (
        !lodash_1["default"].isEqual(
          currentBlock,
          crypto_1.calculateBlockHash(currentBlock)
        )
      ) {
        log(
          chalk_1["default"].red(
            "Chain is invalid at this point. Recalculated hash for block at index: " +
              currentBlock.index +
              " does not match initial state."
          )
        );
        return { value: false };
      }
      for (var _i = 0, _a = currentBlock.data; _i < _a.length; _i++) {
        var transaction = _a[_i];
        log(
          chalk_1["default"].blue(
            "Verifying signature for transaction: " + transaction.hash
          )
        );
        if (!crypto_1.verifySignature(transaction)) {
          log(
            chalk_1["default"].red(
              "Signature not valid for transaction: " + transaction.hash
            )
          );
          return { value: false };
        }
      }
    };
    var this_1 = this;
    for (var i = 1; i < this.chain.length; i++) {
      var state_1 = _loop_1(i);
      if (typeof state_1 === "object") return state_1.value;
    }
    log(chalk_1["default"].green("Chain is valid"));
    return true;
  };
  BlockChain.prototype.replaceChain = function (chain) {
    this.chain = chain;
  };
  BlockChain.prototype.getChain = function () {
    return __spreadArrays(this.chain);
  };
  BlockChain.prototype.getPendingTransactions = function () {
    return __spreadArrays(this.transactionPool);
  };
  BlockChain.prototype.getBlockByHash = function (hash) {
    return lodash_1["default"].find(this.chain, function (block) {
      return lodash_1["default"].isEqual(block.hash, hash);
    });
  };
  BlockChain.prototype.checkDuplicateBlock = function (block) {
    log(chalk_1["default"].blue("Checking block for duplicity"));
    var exists = lodash_1["default"].find(this.chain, function (b) {
      return (
        lodash_1["default"].isEqual(b.hash, block.hash) ||
        (lodash_1["default"].gt(b.merkleRoot.trim().length, 0) &&
          lodash_1["default"].isEqual(block.merkleRoot, b.merkleRoot))
      );
    });
    if (!!exists) {
      log(chalk_1["default"].red("Duplicate block found: " + exists.hash));
    }
    return !!exists;
  };
  BlockChain.prototype.checkDuplicateTransaction = function (transaction) {
    log(chalk_1["default"].blue("Checking transaction for duplicity"));
    var exists = lodash_1["default"].find(this.transactionPool, function (txn) {
      return lodash_1["default"].isEqual(transaction.hash, txn.hash);
    });
    if (!!exists) {
      log(
        chalk_1["default"].red("Duplicate transaction found: " + exists.hash)
      );
    }
    return !!exists;
  };
  BlockChain.prototype.checkBlockHasTransaction = function (transaction) {
    log(chalk_1["default"].blue("Checking transaction for duplicity"));
    var exists = lodash_1["default"].find(this.chain, function (block) {
      return lodash_1["default"].includes(
        lodash_1["default"].map(block.data, function (tx) {
          return tx.hash;
        }),
        transaction.hash
      );
    });
    if (!!exists) {
      log(
        chalk_1["default"].red("Duplicate transaction found: " + exists.hash)
      );
    }
    return !!exists;
  };
  BlockChain.prototype.removeBlockedTransactionFromPool = function (block) {
    var _loop_2 = function (transaction) {
      var exists = lodash_1["default"].find(
        lodash_1["default"].map(this_2.transactionPool, function (txn) {
          return txn.hash;
        }),
        function (hash) {
          return lodash_1["default"].isEqual(hash, transaction.hash);
        }
      );
      if (!!exists) {
        var index = lodash_1["default"].indexOf(
          this_2.transactionPool,
          lodash_1["default"].find(this_2.transactionPool, function (txn) {
            return lodash_1["default"].isEqual(txn.hash, exists);
          })
        );
        this_2.transactionPool.splice(index, 1);
      }
    };
    var this_2 = this;
    for (var _i = 0, _a = block.data; _i < _a.length; _i++) {
      var transaction = _a[_i];
      _loop_2(transaction);
    }
  };
  return BlockChain;
})();
exports.BlockChain = BlockChain;
