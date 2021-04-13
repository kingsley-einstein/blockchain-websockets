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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
exports.__esModule = true;
exports.calculateBytes = exports.calculateMerkleRoot = exports.calculateBlockHash = exports.calculateTransactionHash = exports.verifySignature = exports.signTransaction = exports.generateRandom = exports.recoverFromPk = exports.generateAccount = void 0;
var chalk_1 = __importDefault(require("chalk"));
var debug_1 = __importDefault(require("debug"));
var elliptic_1 = require("elliptic");
var lodash_1 = __importDefault(require("lodash"));
var crypto_js_1 = __importDefault(require("crypto-js"));
var ec = new elliptic_1.ec("secp256k1");
var log = debug_1["default"]("crypto");
var to0x = function (key) {
  return "0x" + key;
};
var strip0x = function (key) {
  return key.replace(/0x/i, "");
};
exports.generateAccount = function (passphrase) {
  var pk = crypto_js_1["default"]
    .MD5(passphrase)
    .toString(crypto_js_1["default"].enc.Hex);
  var keypair = ec.keyFromPrivate(pk);
  return {
    address: to0x(keypair.getPublic(true, "hex")),
    secret: to0x(pk)
  };
};
exports.recoverFromPk = function (pk) {
  var keypair = ec.keyFromPrivate(strip0x(pk));
  return {
    address: to0x(keypair.getPublic(true, "hex")),
    secret: pk
  };
};
exports.generateRandom = function () {
  var keypair = ec.genKeyPair();
  return {
    address: to0x(keypair.getPublic(true, "hex")),
    secret: to0x(keypair.getPrivate("hex"))
  };
};
exports.signTransaction = function (transaction, pk) {
  var account = exports.recoverFromPk(pk);
  var txn = __assign(__assign({}, transaction), {
    sender: account.address,
    signature: to0x(
      ec
        .keyFromPrivate(strip0x(account.secret))
        .sign(transaction.hash, "base64")
        .toDER("hex")
    )
  });
  return txn;
};
exports.verifySignature = function (transaction) {
  var keypair = ec.keyFromPublic(strip0x(transaction.sender), "hex");
  return keypair.verify(transaction.hash, strip0x(transaction.signature));
};
exports.calculateTransactionHash = function (transaction) {
  return __assign(__assign({}, transaction), {
    hash: crypto_js_1["default"]
      .SHA256(
        JSON.stringify({
          sender: transaction.sender,
          recipient: transaction.recipient,
          amount: transaction.amount,
          isCoinbase: transaction.isCoinbase,
          coinbaseAddress: transaction.coinbaseAddress,
          timestamp: transaction.timestamp
        })
      )
      .toString(crypto_js_1["default"].enc.Base64)
  });
};
exports.calculateBlockHash = function (block) {
  return __assign(__assign({}, block), {
    hash: crypto_js_1["default"]
      .SHA256(
        JSON.stringify({
          index: block.index,
          previousHash: block.previousHash,
          timestamp: block.timestamp,
          nonce: block.nonce,
          difficulty: block.difficulty,
          data: block.data,
          merkleRoot: block.merkleRoot
        })
      )
      .toString(crypto_js_1["default"].enc.Hex)
  });
};
exports.calculateMerkleRoot = function (transactions) {
  if (lodash_1["default"].isEqual(transactions.length, 0)) return "";
  var root = [
    lodash_1["default"].map(transactions, function (tx) {
      return tx.hash;
    })
  ];
  log(
    chalk_1["default"].blue(
      "Running merkle hash derivation for tree: " + JSON.stringify(root)
    )
  );
  while (lodash_1["default"].gt(lodash_1["default"].head(root).length, 1)) {
    var temp = [];
    for (var i = 0; i < lodash_1["default"].head(root).length; i += 2) {
      if (
        lodash_1["default"].lt(
          i,
          lodash_1["default"].subtract(lodash_1["default"].head(root).length, 1)
        ) &&
        lodash_1["default"].isEqual(i % 2, 0)
      ) {
        temp = lodash_1["default"].concat(
          temp,
          crypto_js_1["default"]
            .SHA256(
              lodash_1["default"].head(root)[i] +
                lodash_1["default"].head(root)[i + 1]
            )
            .toString()
        );
      } else {
        temp = lodash_1["default"].concat(
          temp,
          lodash_1["default"].head(root)[i]
        );
      }
    }
    root.unshift(temp);
  }
  return lodash_1["default"].head(root)[0];
};
exports.calculateBytes = function (transaction) {
  return crypto_js_1["default"].SHA256(
    transaction.sender +
      transaction.recipient +
      transaction.timestamp +
      transaction.amount +
      transaction.hash +
      transaction.signature
  ).sigBytes;
};
