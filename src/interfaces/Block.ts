import { Transactions } from "./Tx";

export interface Block {
  index: number;
  timestamp: number;
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
  data: Transactions;
  merkleRoot: string;
}

export type Blocks = Array<Block>;
