import { useEffect, useRef } from "react";

function useTasksSocket(onTaskUpdate) {
  const callbackRef = useRef(onTaskUpdate);

  useEffect(() => {
    callbackRef.current = onTaskUpdate;
  }, [onTaskUpdate]);

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let manuallyClosed = false;

    const connectWebSocket = () => {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        console.log(
          "Task WebSocket: No access token."
        );
        return;
      }

      const protocol =
        window.location.protocol === "https:"
          ? "wss:"
          : "ws:";

      const host =
        window.location.hostname ||
        "127.0.0.1";

      const url =
        `${protocol}//${host}:8000/ws/tasks/?token=${encodeURIComponent(
          token
        )}`;

      console.log(
        "Connecting Task WebSocket..."
      );

      socket = new WebSocket(url);

      socket.onopen = () => {
        console.log(
          "Task WebSocket connected."
        );
      };

      socket.onmessage = (event) => {
        try {
          const data =
            JSON.parse(event.data);

          console.log(
            "Task WebSocket message:",
            data
          );

          if (
            data.type === "connection"
          ) {
            console.log(
              data.message
            );

            return;
          }

          if (
            data.type === "task_update"
          ) {
            if (
              callbackRef.current
            ) {
              callbackRef.current(
                data
              );
            }
          }
        } catch (error) {
          console.error(
            "Task WebSocket message error:",
            error
          );
        }
      };

      socket.onerror = (error) => {
        console.error(
          "Task WebSocket error:",
          error
        );
      };

      socket.onclose = (event) => {
        console.log(
          "Task WebSocket disconnected:",
          event.code,
          event.reason
        );

        if (
          !manuallyClosed
        ) {
          reconnectTimer =
            setTimeout(() => {
              connectWebSocket();
            }, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      manuallyClosed = true;

      if (reconnectTimer) {
        clearTimeout(
          reconnectTimer
        );
      }

      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;

        if (
          socket.readyState ===
            WebSocket.OPEN ||
          socket.readyState ===
            WebSocket.CONNECTING
        ) {
          socket.close(
            1000,
            "Component unmounted"
          );
        }
      }
    };
  }, []);
}

export default useTasksSocket;