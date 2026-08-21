import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Login from "./Login";
import Signup from "./Signup";

import Dashboard from "./Dashboard";
import Tasks from "./Tasks";
import Projects from "./Projects";
import Notifications from "./Notifications";

import { getNotifications } from "./api";
import useNotificationsSocket from "./useNotificationsSocket";

function App() {
  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(
    Boolean(
      localStorage.getItem(
        "access_token"
      )
    )
  );

  const [showSignup, setShowSignup] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState("dashboard");

  const [selectedTaskId, setSelectedTaskId] =
    useState(null);

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState(null);

  const knownNotificationIds =
    useRef(new Set());

  /*
   * Load existing notifications
   * when authenticated.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const loadUnreadNotifications =
      async () => {
        try {
          const data =
            await getNotifications();

          const notifications =
            data.results ||
            data ||
            [];

          knownNotificationIds.current =
            new Set(
              notifications.map(
                (notification) =>
                  notification.id
              )
            );

          const unreadCount =
            notifications.filter(
              (notification) =>
                !notification.is_read
            ).length;

          setUnreadNotifications(
            unreadCount
          );
        } catch (error) {
          if (
            error.message !==
            "SESSION_EXPIRED"
          ) {
            console.error(
              "Unable to load notifications:",
              error
            );
          }
        }
      };

    loadUnreadNotifications();
  }, [isAuthenticated]);

  /*
   * WebSocket notification handler.
   */
  const handleSocketNotification =
    useCallback(
      (notification) => {
        if (!notification) {
          return;
        }

        if (
          knownNotificationIds.current.has(
            notification.id
          )
        ) {
          return;
        }

        knownNotificationIds.current.add(
          notification.id
        );

        if (!notification.is_read) {
          setUnreadNotifications(
            (current) =>
              current + 1
          );
        }

        console.log(
          "New notification received:",
          notification
        );
      },
      []
    );

  useNotificationsSocket(
    isAuthenticated
      ? handleSocketNotification
      : null
  );

  /*
   * Login / Signup screen.
   */
  if (!isAuthenticated) {
    if (showSignup) {
      return (
        <Signup
          onSignup={() => {
            setShowSignup(false);
          }}
          onBackToLogin={() => {
            setShowSignup(false);
          }}
        />
      );
    }

    return (
      <Login
        onLogin={() => {
          setIsAuthenticated(true);
          setShowSignup(false);
          setCurrentPage(
            "dashboard"
          );
        }}
        onSignup={() => {
          setShowSignup(true);
        }}
      />
    );
  }

  /*
   * Logout.
   */
  const handleLogout = () => {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    knownNotificationIds.current.clear();

    setIsAuthenticated(false);
    setShowSignup(false);
    setCurrentPage("dashboard");
    setSelectedTaskId(null);
    setSelectedProjectId(null);
    setUnreadNotifications(0);
  };

  /*
   * Open a task from notification.
   */
  const handleOpenTask = (
    taskId
  ) => {
    setSelectedTaskId(taskId);
    setCurrentPage("tasks");
  };

  /*
   * Open a project.
   */
  const handleOpenProject = (
    projectId
  ) => {
    setSelectedProjectId(projectId);
    setCurrentPage("projects");
  };

  let page;

  if (
    currentPage === "dashboard"
  ) {
    page = (
      <Dashboard
        onOpenProject={
          handleOpenProject
        }
      />
    );
  }

  else if (
    currentPage === "tasks"
  ) {
    page = (
      <Tasks
        selectedTaskId={
          selectedTaskId
        }
        onTaskOpened={() =>
          setSelectedTaskId(null)
        }
      />
    );
  }

  else if (
    currentPage === "projects"
  ) {
    page = (
      <Projects
        selectedProjectId={
          selectedProjectId
        }
        onProjectOpened={() =>
          setSelectedProjectId(null)
        }
      />
    );
  }

  else if (
    currentPage ===
    "notifications"
  ) {
    page = (
      <Notifications
  onOpenTask={handleOpenTask}
  onUnreadCountChange={
    setUnreadNotifications
  }
/>
    );
  }

  return (
    <div className="app">

      <header className="topbar">

        <div
          className="logo"
          onClick={() =>
            setCurrentPage(
              "dashboard"
            )
          }
        >
          TaskFlow
        </div>

        <div className="topbar-right">

          <button
            className={
              currentPage ===
              "dashboard"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setCurrentPage(
                "dashboard"
              )
            }
          >
            Dashboard
          </button>

          <button
            className={
              currentPage ===
              "projects"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setCurrentPage(
                "projects"
              )
            }
          >
            Projects
          </button>

          <button
            className={
              currentPage ===
              "tasks"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setCurrentPage(
                "tasks"
              )
            }
          >
            Tasks
          </button>

          <button
            className={
              currentPage ===
              "notifications"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setCurrentPage(
                "notifications"
              )
            }
          >
            <span className="notification-nav">

              Notifications

              {unreadNotifications >
                0 && (
                <span className="notification-badge">
                  {unreadNotifications >
                  99
                    ? "99+"
                    : unreadNotifications}
                </span>
              )}

            </span>
          </button>

          <button
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>

        </div>

      </header>

      {page}

    </div>
  );
}

export default App;