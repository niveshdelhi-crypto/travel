export type VonageOutboundCallTarget = {
  type: "phone";
  number: string;
};

export type VonageCreateOutboundCallParams = {
  to: VonageOutboundCallTarget[];
  from: VonageOutboundCallTarget;
  answerUrl: string[];
  eventUrl: string[];
  machineDetection?: "continue" | "hangup";
};

export type VonageCreateOutboundCallResult = {
  uuid: string;
  status?: string;
  direction?: string;
  conversationUuid?: string;
};
