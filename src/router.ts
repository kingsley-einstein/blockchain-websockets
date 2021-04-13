import express from "express";
import { Ops } from "./main/operations";

const router = express.Router();

router.post("/account", Ops.generatePair);
router.post("/transaction", Ops.createAndSignTransaction);
router.get("/chain", Ops.requestChain);
router.get("/pending", Ops.requestPendingTransactions);

export default router;
