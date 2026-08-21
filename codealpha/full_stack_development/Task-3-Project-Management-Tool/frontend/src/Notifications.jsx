import { useEffect, useState } from "react";
import {
  getNotifications,
  clearAllNotifications,
  apiRequest,
} from "./api";
import useNotificationsSocket from "./useNotificationsSocket";

function Notifications({
  onOpenTask,
  onUnreadCountChange,
}) {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const data =
        await getNotifications();

      setNotifications(
        data.results || data || []
      );
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          "Unable to load notifications."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * Initial load only.
   *
   * We no longer poll every 10 seconds.
   * New notifications arrive through WebSocket.
   */
  useEffect(() => {
    loadNotifications();
  }, []);

  /*
   * Receive new notifications instantly
   * through WebSocket.
   */
  const handleSocketNotification = (
  notification
) => {
  if (!notification) {
    return;
  }

  setNotifications((current) => {
    const existingNotification =
      current.find(
        (item) =>
          item.id ===
          notification.id
      );

    // Existing notification:
    // update it instead of ignoring it.
    if (existingNotification) {
      return current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              ...notification,
            }
          : item
      );
    }

    // New notification
    return [
      notification,
      ...current,
    ];
  });
};

  useNotificationsSocket(
    handleSocketNotification
  );

  const markAsRead = async (
    notification
  ) => {
    if (notification.is_read) {
      return;
    }

    setUpdatingId(notification.id);

    try {
      await apiRequest(
        `/notifications/${notification.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            is_read: true,
          }),
        }
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          error.message ||
            "Unable to update notification."
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const markAsUnread = async (
    notification
  ) => {
    if (!notification.is_read) {
      return;
    }

    setUpdatingId(notification.id);

    try {
      await apiRequest(
        `/notifications/${notification.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            is_read: false,
          }),
        }
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: false,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          error.message ||
            "Unable to update notification."
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteNotification = async (
    notification
  ) => {
    const confirmed =
      window.confirm(
        "Delete this notification?"
      );

    if (!confirmed) {
      return;
    }

    setUpdatingId(notification.id);

    try {
      await apiRequest(
        `/notifications/${notification.id}/`,
        {
          method: "DELETE",
        }
      );

      setNotifications((current) =>
        current.filter(
          (item) =>
            item.id !==
            notification.id
        )
      );
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          error.message ||
            "Unable to delete notification."
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications =
      notifications.filter(
        (notification) =>
          !notification.is_read
      );

    if (
      unreadNotifications.length ===
      0
    ) {
      return;
    }

    setUpdatingId("all-read");

    try {
      await Promise.all(
        unreadNotifications.map(
          (notification) =>
            apiRequest(
              `/notifications/${notification.id}/`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  is_read: true,
                }),
              }
            )
        )
      );

      setNotifications((current) =>
        current.map(
          (notification) => ({
            ...notification,
            is_read: true,
          })
        )
      );
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          error.message ||
            "Unable to mark notifications as read."
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const clearAll = async () => {
    if (
      notifications.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete all notifications?"
      );

    if (!confirmed) {
      return;
    }

    setUpdatingId("all");

    try {
      await clearAllNotifications();

      setNotifications([]);
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          error.message ||
            "Unable to clear notifications."
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNotificationClick =
    async (notification) => {
      try {
        if (!notification.is_read) {
          await markAsRead(
            notification
          );
        }

        if (
          notification.task &&
          onOpenTask
        ) {
          onOpenTask(
            notification.task
          );
        }
      } catch (error) {
        console.error(error);
      }
    };

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;
  useEffect(() => {
  if (onUnreadCountChange) {
    onUnreadCountChange(unreadCount);
  }
}, [
  unreadCount,
  onUnreadCountChange,
]);

  const formatDate = (date) => {
    return new Date(
      date
    ).toLocaleString();
  };

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Notifications</h1>

          <p>
            Stay updated with your
            TaskFlow activity.
          </p>
        </div>

        <div className="notification-header-actions">
          {unreadCount > 0 && (
            <button
              className="secondary-button"
              onClick={
                markAllAsRead
              }
              disabled={
                updatingId ===
                "all-read"
              }
            >
              {updatingId ===
              "all-read"
                ? "Updating..."
                : "Mark all as read"}
            </button>
          )}

          {notifications.length >
            0 && (
            <button
              className="delete-button"
              onClick={clearAll}
              disabled={
                updatingId === "all"
              }
            >
              {updatingId === "all"
                ? "Clearing..."
                : "Clear all"}
            </button>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="notification-summary">
          <strong>
            {unreadCount}
          </strong>{" "}
          unread notification
          {unreadCount !== 1
            ? "s"
            : ""}
        </div>
      )}

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <section className="project-section">
        {loading ? (
          <div className="task-row">
            <p>
              Loading notifications...
            </p>
          </div>
        ) : notifications.length ===
          0 ? (
          <div className="task-row">
            <p>
              No notifications yet.
            </p>
          </div>
        ) : (
          notifications.map(
            (notification) => (
              <div
                className={`notification-row ${
                  notification.is_read
                    ? "read"
                    : "unread"
                } ${
                  notification.task
                    ? "clickable"
                    : ""
                }`}
                key={
                  notification.id
                }
                onClick={() =>
                  handleNotificationClick(
                    notification
                  )
                }
              >
                <div className="notification-content">
                  <div className="notification-header">
                    <span className="notification-type">
                      {
                        notification.notification_type_display
                      }
                    </span>

                    {!notification.is_read && (
                      <span className="unread-badge">
                        New
                      </span>
                    )}
                  </div>

                  <p>
                    {
                      notification.message
                    }
                  </p>

                  {notification.task_title && (
                    <span className="notification-task">
                      Task:{" "}
                      <strong>
                        {
                          notification.task_title
                        }
                      </strong>
                    </span>
                  )}

                  <small>
                    {formatDate(
                      notification.created_at
                    )}
                  </small>
                </div>

                <div
                  className="notification-actions"
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                >
                  {notification.is_read ? (
                    <button
                      className="notification-action-button"
                      disabled={
                        updatingId ===
                        notification.id
                      }
                      onClick={() =>
                        markAsUnread(
                          notification
                        )
                      }
                    >
                      {updatingId ===
                      notification.id
                        ? "Updating..."
                        : "Mark unread"}
                    </button>
                  ) : (
                    <button
                      className="notification-action-button"
                      disabled={
                        updatingId ===
                        notification.id
                      }
                      onClick={() =>
                        markAsRead(
                          notification
                        )
                      }
                    >
                      {updatingId ===
                      notification.id
                        ? "Updating..."
                        : "Mark as read"}
                    </button>
                  )}

                  <button
                    className="notification-action-button"
                    disabled={
                      updatingId ===
                      notification.id
                    }
                    onClick={() =>
                      deleteNotification(
                        notification
                      )
                    }
                  >
                    {updatingId ===
                    notification.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            )
          )
        )}
      </section>
    </main>
  );
}

export default Notifications;