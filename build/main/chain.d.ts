import { Block, Blocks } from "../interfaces/Block";
import { Transaction, Transactions } from "../interfaces/Tx";
export declare class BlockChain {
  chain: Blocks;
  transactionPool: Transactions;
  coinbase: string;
  constructor();
  genesisBlock(): Block;
  private getLastBlock;
  private adjustDifficulty;
  signTransaction(txn: Transaction | string, pk: string): Array<Transaction>;
  addTransactionToPool(txn: Transaction): Transaction;
  addBlock(block: Block): void;
  mineBlock(): Block;
  isChainValid(): boolean;
  replaceChain(chain: Blocks): void;
  getChain(): Block[];
  getPendingTransactions(): Transaction[];
  getBlockByHash(hash: string): Block;
  checkDuplicateBlock(block: Block): boolean;
  checkDuplicateTransaction(transaction: Transaction): boolean;
  checkBlockHasTransaction(transaction: Transaction): boolean;
  removeBlockedTransactionFromPool(block: Block): void;
}
//# sourceMappingURL=chain.d.ts.map
