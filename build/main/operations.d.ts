import express from "express";
export declare class Ops {
  static generatePair(
    req: express.Request,
    res: express.Response
  ): express.Response<any, Record<string, any>>;
  static createAndSignTransaction(
    req: express.Request,
    res: express.Response
  ): express.Response<any, Record<string, any>>;
  static requestChain(
    req: express.Request,
    res: express.Response
  ): express.Response<any, Record<string, any>>;
  static requestPendingTransactions(
    req: express.Request,
    res: express.Response
  ): express.Response<any, Record<string, any>>;
}
//# sourceMappingURL=operations.d.ts.map
