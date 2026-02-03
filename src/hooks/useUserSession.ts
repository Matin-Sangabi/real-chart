import { useEffect, useRef, useState } from "react";
import { socket } from "../config/socket.config";
import type { UserReadyPayload } from "../types/chart.types";
import { SocketEmit } from "../common/enums/socketEmit.enum";

export default function useUserSession() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [userReady, setUserReady] = useState<UserReadyPayload | null>(null);

  const didInit = useRef(false);

  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      setIsConnected(true);
      if (!didInit.current) {
        didInit.current = true;
        socket.emit(SocketEmit.userInit);
      }
    };

    const onDisconnect = () => {
      console.log("Disconnected Socket");
      setIsConnected(false);
    };

    const onUserReady = (payload: UserReadyPayload) => {
      setUserReady(payload);
    };

    // socket emit
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("user-ready", onUserReady);
    socket.on("connect_error", (err) => {
      console.error("Socket Connection has error : ", err);
    });

    //return
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("user-ready", onUserReady);
      socket.disconnect();
    };
  }, []);

  return { socket, isConnected, userReady };
}
