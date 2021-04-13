export declare enum MessageType {
  CHAIN = "CHAIN",
  TRANSACTION = "TRANSACTION",
  BLOCK = "BLOCK"
}
export interface Message {
  type: MessageType;
  body: object;
}
//# sourceMappingURL=Message.d.ts.map
