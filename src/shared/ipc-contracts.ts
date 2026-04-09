export const IPC_CHANNELS = {
  appPing: "app:ping",
} as const;

export type AppPingResult = {
  ok: boolean;
  message: string;
};
