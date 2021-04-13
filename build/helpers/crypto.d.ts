import { Transaction, Transactions } from "../interfaces/Tx";
import { Block } from "../interfaces/Block";
export declare const generateAccount: (
  passphrase: string
) => {
  address: string;
  secret: string;
};
export declare const recoverFromPk: (
  pk: string
) => {
  address: string;
  secret: string;
};
export declare const generateRandom: () => {
  address: string;
  secret: string;
};
export declare const signTransaction: (
  transaction: Transaction,
  pk: string
) => Transaction;
export declare const verifySignature: (transaction: Transaction) => boolean;
export declare const calculateTransactionHash: (
  transaction: Transaction
) => Transaction;
export declare const calculateBlockHash: (
  block: Block
) => {
  hash: string;
  index: number;
  timestamp: number;
  previousHash: string;
  nonce: number;
  difficulty: number;
  data: Transactions;
  merkleRoot: string;
};
export declare const calculateMerkleRoot: (
  transactions: Transactions
) => string;
export declare const calculateBytes: (transaction: Transaction) => number;
//# sourceMappingURL=crypto.d.ts.map
