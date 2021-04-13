export interface Transaction {
  sender: string;
  recipient: string;
  amount: number;
  hash: string;
  timestamp: number;
  isCoinbase: boolean;
  coinbaseAddress: string;
  signature: string;
}
export declare type Transactions = Array<Transaction>;
//# sourceMappingURL=Tx.d.ts.map
