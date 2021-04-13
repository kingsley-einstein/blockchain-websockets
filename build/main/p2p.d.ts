import Ws from "ws";
import { Message } from "../interfaces/Message";
import { BlockChain } from "./chain";
export declare class P2P {
  peers: Array<string>;
  clients: Array<Ws>;
  port: number;
  chain: BlockChain;
  constructor(chain?: BlockChain);
  listen(): void;
  connectToPeers(): void;
  private initConnection;
  private addPeer;
  private handleSocketEvents;
  private handleMessages;
  broadcast(message: Message): void;
  private sendChainToNewlyConnectedPeer;
  private removeClient;
  private addTransactionToPool;
  private addBlock;
  private replaceChain;
  mineBlocks(): void;
  checkValidity(): void;
}
//# sourceMappingURL=p2p.d.ts.map
