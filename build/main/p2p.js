"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
exports.__esModule = true;
exports.P2P = void 0;
var ws_1 = __importDefault(require("ws"));
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var chalk_1 = __importDefault(require("chalk"));
var Message_1 = require("../interfaces/Message");
var chain_1 = require("./chain");
var constants_1 = require("./constants");
var log = debug_1["default"]("p2p");
var P2P = /** @class */ (function () {
  function P2P(chain) {
    this.peers = [];
    this.clients = [];
    this.port = 5001;
    this.chain = chain || new chain_1.BlockChain();
    this.peers = process.env.PEERS ? process.env.PEERS.split(",") : [];
    this.port = process.env.P2P_PORT
      ? parseInt(process.env.P2P_PORT)
      : Math.floor(Math.random() * 5001);
    // this.listen();
    // this.connectToPeers();
  }
  P2P.prototype.listen = function () {
    var _this = this;
    var server = new ws_1["default"].Server({ port: this.port });
    log(chalk_1["default"].blue("Websocket running on " + this.port));
    server.on("connection", function (socket) {
      _this.initConnection(socket);
      _this.sendChainToNewlyConnectedPeer(socket);
    });
    server.on("error", function (err) {
      return log(
        chalk_1["default"].red(
          "==== An error occured while initializing peer server: " +
            err.message +
            " ===="
        )
      );
    });
  };
  P2P.prototype.connectToPeers = function () {
    for (var _i = 0, _a = this.peers; _i < _a.length; _i++) {
      var peer = _a[_i];
      if (!peer.startsWith("ws"))
        log(chalk_1["default"].red('==== Peer URL must begin with "ws" ===='));
      else this.addPeer(peer);
    }
  };
  P2P.prototype.initConnection = function (socket) {
    this.handleSocketEvents(socket);
    this.handleMessages(socket);
    this.clients = lodash_1["default"].concat(this.clients, socket);
    // this.sendChainToNewlyConnectedPeer(socket);
  };
  P2P.prototype.addPeer = function (url) {
    var socket = new ws_1["default"](url);
    log(chalk_1["default"].blue("Adding peer at " + url));
    this.initConnection(socket);
  };
  P2P.prototype.handleSocketEvents = function (socket) {
    var _this = this;
    socket.on("open", function () {
      return log(
        chalk_1["default"].green("Connected to peer with URL: " + socket.url)
      );
    });
    socket.on("error", function () {
      return log(
        chalk_1["default"].red("Error occured with peer: " + socket.url)
      );
    });
    socket.on("close", function () {
      return _this.removeClient(socket);
    });
  };
  P2P.prototype.handleMessages = function (socket) {
    var _this = this;
    socket.on("message", function (message) {
      var messageObject = JSON.parse(message);
      switch (messageObject.type) {
        case Message_1.MessageType.CHAIN: {
          log(
            chalk_1["default"].green(
              "==== Received message ====\n",
              JSON.stringify(messageObject, null, 2)
            )
          );
          _this.replaceChain(messageObject.body);
          break;
        }
        case Message_1.MessageType.BLOCK: {
          log(
            chalk_1["default"].green(
              "==== Received message ====\n",
              JSON.stringify(messageObject, null, 2)
            )
          );
          _this.addBlock(messageObject.body);
          _this.chain.removeBlockedTransactionFromPool(messageObject.body);
          break;
        }
        case Message_1.MessageType.TRANSACTION: {
          log(
            chalk_1["default"].green(
              "==== Received message ====\n",
              JSON.stringify(messageObject, null, 2)
            )
          );
          _this.addTransactionToPool(messageObject.body);
          break;
        }
        default:
          log(chalk_1["default"].red("==== Unknown message ===="));
          break;
      }
    });
  };
  P2P.prototype.broadcast = function (message) {
    for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
      var client = _a[_i];
      client.send(JSON.stringify(message));
    }
  };
  P2P.prototype.sendChainToNewlyConnectedPeer = function (peer) {
    peer.send(
      JSON.stringify({
        type: Message_1.MessageType.CHAIN,
        body: this.chain.getChain()
      })
    );
  };
  P2P.prototype.removeClient = function (socket) {
    log(chalk_1["default"].yellow("==== Removing peer ==== \n " + socket.url));
    this.peers.splice(lodash_1["default"].indexOf(this.peers, socket.url), 1);
    this.clients.splice(lodash_1["default"].indexOf(this.clients, socket), 1);
  };
  P2P.prototype.addTransactionToPool = function (tx) {
    if (
      this.chain.checkDuplicateTransaction(tx) ||
      this.chain.checkBlockHasTransaction(tx)
    )
      return;
    this.chain.addTransactionToPool(tx);
  };
  P2P.prototype.addBlock = function (block) {
    if (this.chain.checkDuplicateBlock(block)) return;
    this.chain.addBlock(block);
  };
  P2P.prototype.replaceChain = function (blocks) {
    this.chain.replaceChain(blocks);
  };
  P2P.prototype.mineBlocks = function () {
    var _this = this;
    setInterval(function () {
      var block = _this.chain.mineBlock();
      _this.chain.addBlock(block);
      _this.broadcast({ type: Message_1.MessageType.BLOCK, body: block });
    }, constants_1.Constants.MINING_INTERVAL);
  };
  P2P.prototype.checkValidity = function () {
    var _this = this;
    setInterval(function () {
      var isValid = _this.chain.isChainValid();
      log(
        chalk_1["default"].blue(
          "Validity ===> " + (isValid ? "Valid" : "Not Valid")
        )
      );
    }, constants_1.Constants.VALIDITY_CHECK_INTERVAL);
  };
  return P2P;
})();
exports.P2P = P2P;
