import _ from "lodash";
import debug from "debug";
import chalk from "chalk";
import {
  calculateBlockHash,
  calculateMerkleRoot,
  calculateTransactionHash,
  signTransaction,
  generateAccount,
  generateRandom,
  calculateBytes,
  verifySignature
} from "../helpers/crypto";
import { Block, Blocks } from "../interfaces/Block";
import { Constants } from "./constants";
import { Transaction, Transactions } from "../interfaces/Tx";

const log = debug("chain");

export class BlockChain {
  chain: Blocks = [];
  transactionPool: Transactions = [];
  coinbase: string = "";

  constructor() {
    this.coinbase = process.env.COINBASE
      ? process.env.COINBASE
      : process.env.PASSPHRASE
      ? generateAccount(process.env.PASSPHRASE).address
      : generateRandom().address;
    this.chain = [this.genesisBlock()];
  }

  genesisBlock(): Block {
    const block: Block = {
      index: 1,
      hash: "",
      previousHash: "0000",
      timestamp: Date.now(),
      nonce: Constants.NONCE,
      difficulty: Constants.DIFFICULTY,
      data: [],
      merkleRoot: ""
    };

    return calculateBlockHash(block);
  }

  private getLastBlock(): Block {
    return _.last(this.chain);
  }

  private adjustDifficulty(lastBlock: Block, currentTime: number): number {
    const difficulty = lastBlock.difficulty;
    return lastBlock.timestamp + Constants.MINING_RATE > currentTime
      ? difficulty + 1
      : difficulty - 1;
  }

  signTransaction(txn: Transaction | string, pk: string): Array<Transaction> {
    let transaction: Transaction = null;

    if (typeof txn === "string") {
      transaction = JSON.parse(Buffer.from(txn, "hex").toString());
    } else {
      transaction = { ...txn };
    }

    const hashedTx = calculateTransactionHash(transaction);
    const signedHashedTx = signTransaction(hashedTx, pk);
    const coinbaseTransaction: Transaction = {
      sender: "",
      recipient: this.coinbase,
      amount: Constants.FEE_PER_BYTES * calculateBytes(signedHashedTx),
      coinbaseAddress: this.coinbase,
      isCoinbase: true,
      hash: "",
      signature: "",
      timestamp: Date.now()
    };

    return [
      signedHashedTx,
      signTransaction(calculateTransactionHash(coinbaseTransaction), pk)
    ];
  }

  addTransactionToPool(txn: Transaction) {
    this.transactionPool = _.concat(this.transactionPool, txn);
    log(chalk.blue("Adding new transaction to pool: " + txn.hash));
    return _.find(
      this.transactionPool,
      transaction => transaction.hash === txn.hash
    );
  }

  addBlock(block: Block) {
    this.chain = _.concat(this.chain, block);
    log(chalk.blue("Added new block to chain"));
  }

  mineBlock(): Block {
    const lastBlock = this.getLastBlock();

    log(chalk.blue(`Mining new block from ancestor: ${lastBlock.hash}`));

    let iteration = 0;

    let block: Block = {
      index: lastBlock.index + 1,
      timestamp: Date.now(),
      nonce: Constants.NONCE,
      difficulty: Constants.DIFFICULTY,
      hash: "",
      previousHash: lastBlock.hash,
      data: this.transactionPool,
      merkleRoot: calculateMerkleRoot(this.transactionPool)
    };

    do {
      iteration++;
      log(chalk.yellow("Running PoW on iteration: " + iteration));
      const currentTime = Date.now();
      block.nonce = block.nonce + 1;
      block.difficulty = this.adjustDifficulty(lastBlock, currentTime);
      block.timestamp = currentTime;
      block = calculateBlockHash(block);
    } while (
      !_.isEqual(
        block.hash.substring(0, block.difficulty),
        "0".repeat(block.difficulty)
      )
    );
    this.addBlock(block);
    this.transactionPool = [];
    return block;
  }

  isChainValid() {
    log(chalk.blue("Now checking chain validity"));

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = _.get(this.chain, i);
      const previousBlock = _.find(this.chain, block =>
        _.isEqual(block.index, currentBlock.index - 1)
      );

      log(chalk.blue("Running check for => ", currentBlock.hash));

      if (!_.isEqual(currentBlock.previousHash, previousBlock.hash)) {
        log(
          chalk.red(
            "Chain is invalid at this point. Faulty block at index: " +
              currentBlock.index
          )
        );
        return false;
      }

      if (!_.isEqual(currentBlock, calculateBlockHash(currentBlock))) {
        log(
          chalk.red(
            "Chain is invalid at this point. Recalculated hash for block at index: " +
              currentBlock.index +
              " does not match initial state."
          )
        );
        return false;
      }

      for (const transaction of currentBlock.data) {
        log(
          chalk.blue("Verifying signature for transaction: " + transaction.hash)
        );

        if (!verifySignature(transaction)) {
          log(
            chalk.red(
              "Signature not valid for transaction: " + transaction.hash
            )
          );
          return false;
        }
      }
    }
    log(chalk.green("Chain is valid"));
    return true;
  }

  replaceChain(chain: Blocks) {
    this.chain = chain;
  }

  getChain() {
    return [...this.chain];
  }

  getPendingTransactions() {
    return [...this.transactionPool];
  }

  getBlockByHash(hash: string) {
    return _.find(this.chain, block => _.isEqual(block.hash, hash));
  }

  checkDuplicateBlock(block: Block) {
    log(chalk.blue("Checking block for duplicity"));
    const exists = _.find(
      this.chain,
      b =>
        _.isEqual(b.hash, block.hash) ||
        (_.gt(b.merkleRoot.trim().length, 0) &&
          _.isEqual(block.merkleRoot, b.merkleRoot))
    );

    if (!!exists) {
      log(chalk.red("Duplicate block found: " + exists.hash));
    }

    return !!exists;
  }

  checkDuplicateTransaction(transaction: Transaction) {
    log(chalk.blue("Checking transaction for duplicity"));
    const exists = _.find(this.transactionPool, txn =>
      _.isEqual(transaction.hash, txn.hash)
    );

    if (!!exists) {
      log(chalk.red("Duplicate transaction found: " + exists.hash));
    }

    return !!exists;
  }

  checkBlockHasTransaction(transaction: Transaction) {
    log(chalk.blue("Checking transaction for duplicity"));
    const exists = _.find(this.chain, block =>
      _.includes(
        _.map(block.data, tx => tx.hash),
        transaction.hash
      )
    );

    if (!!exists) {
      log(chalk.red("Duplicate transaction found: " + exists.hash));
    }

    return !!exists;
  }

  removeBlockedTransactionFromPool(block: Block) {
    for (const transaction of block.data) {
      const exists = _.find(
        _.map(this.transactionPool, txn => txn.hash),
        hash => _.isEqual(hash, transaction.hash)
      );

      if (!!exists) {
        const index = _.indexOf(
          this.transactionPool,
          _.find(this.transactionPool, txn => _.isEqual(txn.hash, exists))
        );
        this.transactionPool.splice(index, 1);
      }
    }
  }
}
