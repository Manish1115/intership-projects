import { useEffect } from "react";

function useNotificationsSocket(
  onNotification
) {
  useEffect(() => {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return;
    }

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/notifications/?token=${encodeURIComponent(
        token
      )}`
    );

    socket.onopen = () => {
      console.log(
        "WebSocket connected."
      );
    };

    socket.onmessage = (event) => {
      try {
        const data =
          JSON.parse(event.data);

        if (
          data.type ===
          "notification"
        ) {
          if (onNotification) {
            onNotification(
              data.notification
            );
          }
        }

        if (
          data.type ===
          "notification_update"
        ) {
          if (onNotification) {
            onNotification({
              ...data.notification,
              _socketAction:
                data.action,
            });
          }
        }

        if (
          data.type ===
          "connection"
        ) {
          console.log(
            data.message
          );
        }
      } catch (error) {
        console.error(
          "WebSocket message error:",
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        "WebSocket error:",
        error
      );
    };

    socket.onclose = () => {
      console.log(
        "WebSocket disconnected."
      );
    };

    return () => {
      socket.close();
    };
  }, [onNotification]);
}

export default useNotificationsSocket;