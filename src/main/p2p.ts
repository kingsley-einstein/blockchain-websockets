import Ws from "ws";
import _ from "lodash";
import debug from "debug";
import chalk from "chalk";
import { Message, MessageType } from "../interfaces/Message";
import { BlockChain } from "./chain";
import { Block, Blocks } from "../interfaces/Block";
import { Constants } from "./constants";
import { Transaction } from "../interfaces/Tx";

const log = debug("p2p");

export class P2P {
  peers: Array<string> = [];
  clients: Array<Ws> = [];
  port: number = 5001;
  chain: BlockChain;

  constructor(chain?: BlockChain) {
    this.chain = chain || new BlockChain();
    this.peers = process.env.PEERS ? process.env.PEERS.split(",") : [];
    this.port = process.env.P2P_PORT ? parseInt(process.env.P2P_PORT) : 5001;
    this.listen();
    this.connectToPeers();
  }

  private listen() {
    const server = new Ws.Server({ port: this.port });
    server.on("connection", socket => this.initConnection(socket));
    server.on("error", err =>
      log(
        chalk.red(
          `==== An error occured while initializing peer server: ${err.message} ====`
        )
      )
    );
  }

  connectToPeers() {
    for (const peer of this.peers)
      if (!peer.startsWith("ws"))
        log(chalk.red('==== Peer URL must begin with "ws" ===='));
      else this.addPeer(peer);
  }

  private initConnection(socket: Ws) {
    this.handleSocketEvents(socket);
    this.handleMessages(socket);
    this.clients = _.concat(this.clients, socket);
    this.sendChainToNewlyConnectedPeer(socket);
  }

  private addPeer(url: string) {
    const socket = new Ws(url);
    this.initConnection(socket);
  }

  private handleSocketEvents(socket: Ws) {
    socket.on("open", () =>
      log(chalk.green(`Connected to peer with URL: ${socket.url}`))
    );
    socket.on("error", () =>
      log(chalk.red(`Error occured with peer: ${socket.url}`))
    );
  }

  private handleMessages(socket: Ws) {
    socket.on("message", message => {
      const messageObject: Message = JSON.parse(message as string);

      switch (messageObject.type) {
        case MessageType.CHAIN:
          log(chalk.green("==== Received chain ===="));
          this.replaceChain(messageObject.body as Blocks);
          break;
        case MessageType.BLOCK:
          log(chalk.green("==== Received block ===="));
          this.addBlock(messageObject.body as Block);
          break;
        case MessageType.TRANSACTION:
          log(chalk.green("==== Received transaction ===="));
          this.addTransactionToPool(messageObject.body as Transaction);
          break;
        default:
          log(chalk.red("==== Unknown message ===="));
          break;
      }
    });
  }

  broadcast(message: Message) {
    for (const client of this.clients) client.send(JSON.stringify(message));
  }

  sendChainToNewlyConnectedPeer(peer: Ws) {
    peer.send(
      JSON.stringify({
        type: MessageType.CHAIN,
        body: this.chain.getChain()
      })
    );
  }

  addTransactionToPool(tx: Transaction) {
    if (
      this.chain.checkDuplicateTransaction(tx) ||
      this.chain.checkBlockHasTransaction(tx)
    )
      return;

    this.chain.addTransactionToPool(tx);
  }

  addBlock(block: Block) {
    if (this.chain.checkDuplicateBlock(block)) return;

    this.chain.addBlock(block);
  }

  replaceChain(blocks: Blocks) {
    if (_.gt(blocks.length, this.chain.getChain().length)) {
      log(chalk.blue("==== Replacing chain ===="));
      this.chain.replaceChain(blocks);
    }
  }

  mineBlocks() {
    setInterval(() => {
      const block = this.chain.mineBlock();
      this.chain.addBlock(block);
      this.broadcast({ type: MessageType.BLOCK, body: block });
    }, Constants.MINING_INTERVAL);
  }
}
