import chalk from "chalk";
import debug from "debug";
import { ec as EC } from "elliptic";
import _ from "lodash";
import Crypto from "crypto-js";
import { Transaction, Transactions } from "../interfaces/Tx";
import { Block } from "../interfaces/Block";

const ec = new EC("secp256k1");
const log = debug("crypto");

const to0x = (key: string) => "0x" + key;
const strip0x = (key: string) => key.replace(/0x/i, "");

export const generateAccount = (passphrase: string) => {
  const pk = Crypto.MD5(passphrase).toString(Crypto.enc.Hex);
  const keypair = ec.keyFromPrivate(pk);
  return {
    address: to0x(keypair.getPublic(true, "hex")),
    secret: to0x(pk)
  };
};

export const recoverFromPk = (pk: string) => {
  const keypair = ec.keyFromPrivate(strip0x(pk));
  return {
    address: to0x(keypair.getPublic(true, "hex")),
    secret: pk
  };
};

export const generateRandom = () => {
  const keypair = ec.genKeyPair();
  return {
    address: to0x(keypair.getPublic(true, "hex")),
    secret: to0x(keypair.getPrivate("hex"))
  };
};

export const signTransaction = (transaction: Transaction, pk: string) => {
  const account = recoverFromPk(pk);
  const txn: Transaction = {
    ...transaction,
    sender: account.address,
    signature: to0x(
      ec
        .keyFromPrivate(strip0x(account.secret))
        .sign(transaction.hash, "base64")
        .toDER("hex")
    )
  };
  return txn;
};

export const verifySignature = (transaction: Transaction) => {
  const keypair = ec.keyFromPublic(strip0x(transaction.sender), "hex");
  return keypair.verify(transaction.hash, strip0x(transaction.signature));
};

export const calculateTransactionHash = (
  transaction: Transaction
): Transaction => {
  return {
    ...transaction,
    hash: Crypto.SHA256(
      JSON.stringify({
        sender: transaction.sender,
        recipient: transaction.recipient,
        amount: transaction.amount,
        isCoinbase: transaction.isCoinbase,
        coinbaseAddress: transaction.coinbaseAddress,
        timestamp: transaction.timestamp
      })
    ).toString(Crypto.enc.Base64)
  };
};

export const calculateBlockHash = (block: Block) => {
  return {
    ...block,
    hash: Crypto.SHA256(
      JSON.stringify({
        index: block.index,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        nonce: block.nonce,
        difficulty: block.difficulty,
        data: block.data,
        merkleRoot: block.merkleRoot
      })
    ).toString(Crypto.enc.Hex)
  };
};

export const calculateMerkleRoot = (transactions: Transactions): string => {
  if (_.isEqual(transactions.length, 0)) return "";

  const root = [_.map(transactions, tx => tx.hash)];

  log(
    chalk.blue(`Running merkle hash derivation for tree: ${_.toString(root)}`)
  );

  while (!_.gt(_.head(root), 1)) {
    let temp: Array<string> = [];

    for (let i = 0; i < _.head(root).length; i += 2) {
      if (_.lt(i, _.subtract(_.head(root).length, 1)) && _.isEqual(i % 2, 0)) {
        temp = _.concat(
          temp,
          Crypto.SHA256(_.head(root)[i] + _.head(root)[i + 1]).toString()
        );
      } else {
        temp = _.concat(temp, _.head(root)[i]);
      }
    }
    root.unshift(temp);
  }

  return _.head(root)[0];
};

export const calculateBytes = (transaction: Transaction): number => {
  return Crypto.SHA256(
    transaction.sender +
      transaction.recipient +
      transaction.timestamp +
      transaction.amount +
      transaction.hash +
      transaction.signature
  ).sigBytes;
};
