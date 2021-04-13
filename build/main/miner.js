"use strict";
exports.__esModule = true;
exports.p2p = exports.chain = void 0;
var chain_1 = require("./chain");
var p2p_1 = require("./p2p");
exports.chain = new chain_1.BlockChain();
exports.p2p = new p2p_1.P2P(exports.chain);
