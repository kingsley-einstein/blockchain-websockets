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

export type Transactions = Array<Transaction>;
