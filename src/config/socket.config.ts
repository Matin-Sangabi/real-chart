import { io, Socket } from "socket.io-client";
import { APP_CONFIG } from "../common/enums/app.enums";

export const socket: Socket = io(APP_CONFIG.ENDPOINT, {
  transports: ["websocket"],
  auth: {
    secret: APP_CONFIG.SECRET_KEY,
  },
  autoConnect: false,
});
