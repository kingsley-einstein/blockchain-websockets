import express from "express";
import { generateAccount } from "../helpers/crypto";
import { MessageType } from "../interfaces/Message";
import { p2p, chain } from "./miner";

export class Ops {
  static generatePair(req: express.Request, res: express.Response) {
    try {
      const pair = generateAccount(req.body.passphrase);
      return res.status(201).json({
        ...pair
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  static createAndSignTransaction(req: express.Request, res: express.Response) {
    try {
      const transactions = chain.signTransaction(
        { ...req.body.transaction, timestamp: Date.now() },
        req.body.pk
      );

      for (const transaction of transactions) {
        chain.addTransactionToPool(transaction);
        p2p.broadcast({ type: MessageType.TRANSACTION, body: transaction });
      }

      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  static requestChain(req: express.Request, res: express.Response) {
    try {
      return res.status(200).json(chain.getChain());
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }

  static requestPendingTransactions(
    req: express.Request,
    res: express.Response
  ) {
    try {
      return res.status(200).json(chain.getPendingTransactions());
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  }
}
