import { BlockChain } from "./chain";
import { P2P } from "./p2p";

export const chain = new BlockChain();
export const p2p = new P2P(chain);
