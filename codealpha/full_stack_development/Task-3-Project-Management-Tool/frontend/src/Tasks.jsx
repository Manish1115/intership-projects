import { useEffect, useState } from "react";

import {
  getTasks,
  updateTask,
  deleteTask,
  getProjects,
  getMe,
} from "./api";

import TaskForm from "./TaskForm";
import Comments from "./Comments";
import useTasksSocket from "./useTasksSocket";

function Tasks({
  selectedTaskId,
  onTaskOpened,
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [viewMode, setViewMode] =
    useState("list");

  const [search, setSearch] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [showTaskForm, setShowTaskForm] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);

  const [deletingTaskId, setDeletingTaskId] =
    useState(null);

  const [updatingTaskId, setUpdatingTaskId] =
    useState(null);

  const [commentTaskId, setCommentTaskId] =
    useState(null);

  const [statusDropdownTaskId, setStatusDropdownTaskId] =
    useState(null);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [projects, setProjects] =
    useState([]);

  /*
   * =====================================================
   * LOAD USER + PROJECTS
   * =====================================================
   */

  const loadUserAndProjects = async () => {
    try {
      const [userData, projectsData] =
        await Promise.all([
          getMe(),
          getProjects(),
        ]);

      setCurrentUser(userData);

      setProjects(
        projectsData.results ||
          projectsData ||
          []
      );
    } catch (error) {
      console.error(
        "Unable to load user/projects:",
        error
      );
    }
  };

  /*
   * =====================================================
   * LOAD TASKS
   * =====================================================
   */

  const loadTasks = async (
    searchValue = search
  ) => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (searchValue.trim()) {
        params.search =
          searchValue.trim();
      }

      const data =
        await getTasks(params);

      setTasks(
        data.results ||
          data ||
          []
      );
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          "Unable to load tasks."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * =====================================================
   * INITIAL LOAD
   * =====================================================
   */

  useEffect(() => {
    loadUserAndProjects();
    loadTasks("");
  }, []);

  /*
   * =====================================================
   * PROJECT OWNER CHECK
   * =====================================================
   */

  const isProjectOwner = (task) => {
    if (!task || !currentUser) {
      return false;
    }

    const project =
      projects.find(
        (item) =>
          Number(item.id) ===
          Number(task.project)
      );

    if (!project) {
      return false;
    }

    const ownerId =
      project.owner?.id ??
      project.owner_id;

    return (
      Number(ownerId) ===
      Number(currentUser.id)
    );
  };

  /*
   * =====================================================
   * REAL-TIME TASK WEBSOCKET
   *
   * IMPORTANT:
   * useTasksSocket handles connection/reconnection.
   * =====================================================
   */

  const handleTaskUpdate = (
    action,
    incomingTask
  ) => {
    if (!incomingTask) {
      return;
    }

    console.log(
      "REAL-TIME TASK UPDATE:",
      action,
      incomingTask
    );

    /*
     * If search is active, reload from API
     * because we need to re-check whether the
     * task still matches the search.
     */
    if (search.trim()) {
      loadTasks(search);
      return;
    }

    /*
     * CREATED
     */
    if (action === "created") {
      setTasks(
        (currentTasks) => {
          const exists =
            currentTasks.some(
              (item) =>
                Number(item.id) ===
                Number(
                  incomingTask.id
                )
            );

          if (exists) {
            return currentTasks;
          }

          return [
            incomingTask,
            ...currentTasks,
          ];
        }
      );

      return;
    }

    /*
     * UPDATED
     */
    if (action === "updated") {
      setTasks(
        (currentTasks) =>
          currentTasks.map(
            (item) =>
              Number(item.id) ===
              Number(
                incomingTask.id
              )
                ? {
                    ...item,
                    ...incomingTask,
                  }
                : item
          )
      );

      return;
    }

    /*
     * DELETED
     */
    if (action === "deleted") {
      setTasks(
        (currentTasks) =>
          currentTasks.filter(
            (item) =>
              Number(item.id) !==
              Number(
                incomingTask.id
              )
          )
      );

      if (
        commentTaskId ===
        incomingTask.id
      ) {
        setCommentTaskId(null);
      }

      if (
        editingTask?.id ===
        incomingTask.id
      ) {
        setEditingTask(null);
      }

      if (
        statusDropdownTaskId ===
        incomingTask.id
      ) {
        setStatusDropdownTaskId(
          null
        );
      }
    }
  };

  useTasksSocket(
    handleTaskUpdate
  );

  /*
   * =====================================================
   * OPEN TASK FROM NOTIFICATION
   * =====================================================
   */

  useEffect(() => {
    if (
      !selectedTaskId ||
      tasks.length === 0
    ) {
      return;
    }

    const taskExists =
      tasks.some(
        (task) =>
          Number(task.id) ===
          Number(selectedTaskId)
      );

    if (taskExists) {
      setCommentTaskId(
        selectedTaskId
      );

      if (onTaskOpened) {
        onTaskOpened();
      }
    }
  }, [
    selectedTaskId,
    tasks,
    onTaskOpened,
  ]);

  /*
   * =====================================================
   * SEARCH
   * =====================================================
   */

  const handleSearch = (
    event
  ) => {
    event.preventDefault();

    const value =
      searchInput.trim();

    setSearch(value);

    loadTasks(value);
  };

  const handleClearSearch =
    () => {
      setSearchInput("");
      setSearch("");

      loadTasks("");
    };

  /*
   * =====================================================
   * CREATE / UPDATE
   * =====================================================
   */

  const handleTaskCreated =
    (createdTask) => {
      setShowTaskForm(false);

      /*
       * Normally the WebSocket will add
       * the task automatically.
       *
       * If the socket does not deliver it,
       * reload as a fallback.
       */
      if (
        createdTask &&
        createdTask.id
      ) {
        setTasks(
          (currentTasks) => {
            const exists =
              currentTasks.some(
                (item) =>
                  Number(item.id) ===
                  Number(
                    createdTask.id
                  )
              );

            if (exists) {
              return currentTasks;
            }

            return [
              createdTask,
              ...currentTasks,
            ];
          }
        );
      } else {
        loadTasks();
      }
    };

  const handleTaskUpdated =
    (updatedTask) => {
      setEditingTask(null);

      if (
        updatedTask &&
        updatedTask.id
      ) {
        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (item) =>
                Number(item.id) ===
                Number(
                  updatedTask.id
                )
                  ? {
                      ...item,
                      ...updatedTask,
                    }
                  : item
            )
        );
      } else {
        loadTasks();
      }
    };

  /*
   * =====================================================
   * DELETE
   * =====================================================
   */

  const handleDelete = async (
    task
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${task.title}"?`
      );

    if (!confirmed) {
      return;
    }

    setDeletingTaskId(
      task.id
    );

    try {
      await deleteTask(
        task.id
      );

      /*
       * Remove immediately from UI.
       * WebSocket will also notify other users.
       */
      setTasks(
        (currentTasks) =>
          currentTasks.filter(
            (item) =>
              Number(item.id) !==
              Number(task.id)
          )
      );

      if (
        commentTaskId ===
        task.id
      ) {
        setCommentTaskId(null);
      }

      if (
        statusDropdownTaskId ===
        task.id
      ) {
        setStatusDropdownTaskId(
          null
        );
      }
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          error.message ||
            "Unable to delete task."
        );
      }
    } finally {
      setDeletingTaskId(
        null
      );
    }
  };

  /*
   * =====================================================
   * STATUS CHANGE
   * =====================================================
   */

  const handleStatusChange =
    async (
      task,
      newStatus
    ) => {
      setStatusDropdownTaskId(
        null
      );

      if (
        task.status ===
        newStatus
      ) {
        return;
      }

      /*
       * Members cannot mark tasks
       * as completed.
       */
      if (
        !isProjectOwner(task) &&
        newStatus === "DONE"
      ) {
        return;
      }

      setUpdatingTaskId(
        task.id
      );

      /*
       * Optimistic UI update.
       * The task changes immediately
       * without waiting for refresh.
       */
      const previousTask =
        task;

      setTasks(
        (currentTasks) =>
          currentTasks.map(
            (item) =>
              Number(item.id) ===
              Number(task.id)
                ? {
                    ...item,
                    status:
                      newStatus,
                    status_display:
                      newStatus ===
                      "TODO"
                        ? "To Do"
                        : newStatus ===
                          "IN_PROGRESS"
                          ? "In Progress"
                          : "Completed",
                  }
                : item
          )
      );

      try {
        const updatedTask =
          await updateTask(
            task.id,
            {
              status:
                newStatus,
            }
          );

        /*
         * Use backend response if available.
         */
        if (
          updatedTask &&
          updatedTask.id
        ) {
          setTasks(
            (currentTasks) =>
              currentTasks.map(
                (item) =>
                  Number(item.id) ===
                  Number(
                    updatedTask.id
                  )
                    ? {
                        ...item,
                        ...updatedTask,
                      }
                    : item
              )
          );
        }
      } catch (error) {
        console.error(error);

        /*
         * Roll back optimistic update
         * if backend rejected it.
         */
        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (item) =>
                Number(item.id) ===
                Number(task.id)
                  ? previousTask
                  : item
            )
        );

        if (
          error.message !==
          "SESSION_EXPIRED"
        ) {
          setError(
            error.message ||
              "Unable to update task."
          );
        }
      } finally {
        setUpdatingTaskId(
          null
        );
      }
    };

  /*
   * =====================================================
   * ASSIGNEE DISPLAY
   * =====================================================
   */

  const getAssignees = (
    task
  ) => {
    /*
     * NEW FORMAT:
     * assigned_to is an array.
     */
    if (
      Array.isArray(
        task.assigned_to
      )
    ) {
      return task.assigned_to;
    }

    /*
     * BACKWARD COMPATIBILITY:
     * If an old task still returns
     * one assigned user.
     */
    if (
      task.assigned_to
    ) {
      return [
        task.assigned_to,
      ];
    }

    return [];
  };

  const getAssigneeNames = (
    task
  ) => {
    const assignees =
      getAssignees(task);

    if (
      assignees.length === 0
    ) {
      return "Unassigned";
    }

    return assignees
      .map(
        (user) =>
          user.username
      )
      .join(", ");
  };

  /*
   * =====================================================
   * FILTERING
   * =====================================================
   */

  const filteredTasks =
    statusFilter === "ALL"
      ? tasks
      : tasks.filter(
          (task) =>
            task.status ===
            statusFilter
        );

  const todoTasks =
    filteredTasks.filter(
      (task) =>
        task.status ===
        "TODO"
    );

  const inProgressTasks =
    filteredTasks.filter(
      (task) =>
        task.status ===
        "IN_PROGRESS"
    );

  const completedTasks =
    filteredTasks.filter(
      (task) =>
        task.status ===
        "DONE"
    );

  /*
   * =====================================================
   * STATUS HELPERS
   * =====================================================
   */

  const getStatusClass = (
    status
  ) => {
    if (
      status ===
      "IN_PROGRESS"
    ) {
      return "in-progress";
    }

    if (status === "DONE") {
      return "completed";
    }

    return "todo";
  };

  /*
   * =====================================================
   * KANBAN CARD
   * =====================================================
   */

  const renderKanbanCard =
    (task) => {
      const isStatusOpen =
        statusDropdownTaskId ===
        task.id;

      const owner =
        isProjectOwner(task);

      const statusOptions = [
        {
          value: "TODO",
          label: "To Do",
        },
        {
          value: "IN_PROGRESS",
          label: "In Progress",
        },
      ];

      if (owner) {
        statusOptions.push({
          value: "DONE",
          label: "Completed",
        });
      }

      return (
        <article
          className="kanban-card"
          key={task.id}
        >
          <div className="kanban-card-header">
            <h3>
              {task.title}
            </h3>

            <span
              className={`status ${getStatusClass(
                task.status
              )}`}
            >
              {task.status_display}
            </span>
          </div>

          <p className="kanban-description">
            {task.description ||
              "No description provided."}
          </p>

          <div className="kanban-meta">
            <span>
              Priority:{" "}
              <strong>
                {
                  task.priority_display
                }
              </strong>
            </span>

            <span>
              Assigned:{" "}
              <strong>
                {getAssigneeNames(
                  task
                )}
              </strong>
            </span>

            {task.due_date && (
              <span>
                Due:{" "}
                <strong>
                  {new Date(
                    task.due_date
                  ).toLocaleDateString()}
                </strong>
              </span>
            )}
          </div>

          {/* STATUS DROPDOWN */}
          <div className="custom-status-dropdown">
            <button
              type="button"
              className={`kanban-status-select ${
                task.status ===
                "DONE"
                  ? "status-select-completed"
                  : task.status ===
                    "IN_PROGRESS"
                    ? "status-select-progress"
                    : "status-select-todo"
              }`}
              disabled={
                updatingTaskId ===
                  task.id ||
                (!owner &&
                  task.status ===
                    "DONE")
              }
              onClick={() =>
                setStatusDropdownTaskId(
                  isStatusOpen
                    ? null
                    : task.id
                )
              }
            >
              <span>
                {task.status ===
                "DONE"
                  ? "Completed"
                  : task.status ===
                    "IN_PROGRESS"
                    ? "In Progress"
                    : "To Do"}
              </span>

              <span className="status-dropdown-arrow">
                {isStatusOpen
                  ? "⌃"
                  : "⌄"}
              </span>
            </button>

            {isStatusOpen && (
              <div className="status-dropdown-menu">
                {statusOptions.map(
                  (option) => (
                    <button
                      type="button"
                      key={
                        option.value
                      }
                      className={
                        task.status ===
                        option.value
                          ? "status-option active"
                          : "status-option"
                      }
                      onClick={() => {
                        setStatusDropdownTaskId(
                          null
                        );

                        handleStatusChange(
                          task,
                          option.value
                        );
                      }}
                    >
                      <span
                        className={`status-option-dot ${
                          option.value ===
                          "TODO"
                            ? "todo-dot"
                            : option.value ===
                              "IN_PROGRESS"
                              ? "progress-dot"
                              : "completed-dot"
                        }`}
                      />

                      {
                        option.label
                      }
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div className="kanban-actions">
            <button
              className="edit-button"
              onClick={() =>
                setEditingTask(
                  task
                )
              }
            >
              Edit
            </button>

            <button
              className="comments-button"
              onClick={() =>
                setCommentTaskId(
                  commentTaskId ===
                    task.id
                    ? null
                    : task.id
                )
              }
            >
              Comments
            </button>

            <button
              className="delete-button"
              onClick={() =>
                handleDelete(
                  task
                )
              }
              disabled={
                deletingTaskId ===
                task.id
              }
            >
              {deletingTaskId ===
              task.id
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>

          {commentTaskId ===
            task.id && (
            <Comments
              taskId={
                task.id
              }
            />
          )}
        </article>
      );
    };

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <>
      <main className="dashboard">

        <div className="dashboard-header">
          <div>
            <h1>
              Tasks
            </h1>

            <p>
              Manage your tasks and
              track progress.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowTaskForm(
                true
              )
            }
          >
            + New Task
          </button>
        </div>

        {/* SEARCH */}

        <form
          className="task-search"
          onSubmit={
            handleSearch
          }
        >
          <input
            type="text"
            value={
              searchInput
            }
            onChange={(event) =>
              setSearchInput(
                event.target.value
              )
            }
            placeholder="Search tasks..."
          />

          <button
            type="submit"
            className="primary-button"
          >
            Search
          </button>

          {search && (
            <button
              type="button"
              className="secondary-button"
              onClick={
                handleClearSearch
              }
            >
              Clear
            </button>
          )}
        </form>

        {search && (
          <p className="search-result-text">
            Showing results for "
            {search}"
          </p>
        )}

        {/* TOOLBAR */}

        <div className="task-toolbar">

          <div className="task-filters">

            <button
              className={
                statusFilter ===
                "ALL"
                  ? "filter-button active"
                  : "filter-button"
              }
              onClick={() =>
                setStatusFilter(
                  "ALL"
                )
              }
            >
              All
            </button>

            <button
              className={
                statusFilter ===
                "TODO"
                  ? "filter-button active"
                  : "filter-button"
              }
              onClick={() =>
                setStatusFilter(
                  "TODO"
                )
              }
            >
              To Do
            </button>

            <button
              className={
                statusFilter ===
                "IN_PROGRESS"
                  ? "filter-button active"
                  : "filter-button"
              }
              onClick={() =>
                setStatusFilter(
                  "IN_PROGRESS"
                )
              }
            >
              In Progress
            </button>

            <button
              className={
                statusFilter ===
                "DONE"
                  ? "filter-button active"
                  : "filter-button"
              }
              onClick={() =>
                setStatusFilter(
                  "DONE"
                )
              }
            >
              Completed
            </button>

          </div>

          <div className="view-switcher">

            <button
              className={
                viewMode ===
                "list"
                  ? "view-button active"
                  : "view-button"
              }
              onClick={() =>
                setViewMode(
                  "list"
                )
              }
            >
              List
            </button>

            <button
              className={
                viewMode ===
                "kanban"
                  ? "view-button active"
                  : "view-button"
              }
              onClick={() =>
                setViewMode(
                  "kanban"
                )
              }
            >
              Kanban
            </button>

          </div>

        </div>

        {/* CONTENT */}

        {loading ? (
          <section className="project-section">
            <div className="task-row">
              <p>
                Loading tasks...
              </p>
            </div>
          </section>
        ) : error ? (
          <section className="project-section">
            <div className="task-row">
              <p>
                {error}
              </p>
            </div>
          </section>
        ) : viewMode ===
          "list" ? (

          <section className="project-section">

            {filteredTasks.length ===
            0 ? (
              <div className="task-row">
                <p>
                  No tasks found.
                </p>
              </div>
            ) : (
              filteredTasks.map(
                (task) => (
                  <div
                    className="task-row task-row-expanded"
                    key={
                      task.id
                    }
                  >

                    <div className="task-main">

                      <strong>
                        {
                          task.title
                        }
                      </strong>

                      <p>
                        {task.description ||
                          "No description provided."}
                      </p>

                      <div className="task-details">

                        <span>
                          Project:{" "}
                          <strong>
                            {
                              task.project_name
                            }
                          </strong>
                        </span>

                        <span>
                          Assigned to:{" "}
                          <strong>
                            {getAssigneeNames(
                              task
                            )}
                          </strong>
                        </span>

                        <span>
                          Priority:{" "}
                          <strong>
                            {
                              task.priority_display
                            }
                          </strong>
                        </span>

                        {task.due_date && (
                          <span>
                            Due:{" "}
                            <strong>
                              {new Date(
                                task.due_date
                              ).toLocaleDateString()}
                            </strong>
                          </span>
                        )}

                      </div>

                    </div>

                    <span
                      className={`status ${getStatusClass(
                        task.status
                      )}`}
                    >
                      {
                        task.status_display
                      }
                    </span>

                    <div className="task-actions">

                      <button
                        className="edit-button"
                        onClick={() =>
                          setEditingTask(
                            task
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="comments-button"
                        onClick={() =>
                          setCommentTaskId(
                            commentTaskId ===
                              task.id
                              ? null
                              : task.id
                          )
                        }
                      >
                        Comments
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDelete(
                            task
                          )
                        }
                        disabled={
                          deletingTaskId ===
                          task.id
                        }
                      >
                        {deletingTaskId ===
                        task.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>

                    {commentTaskId ===
                      task.id && (
                      <div className="task-comments-wrapper">
                        <Comments
                          taskId={
                            task.id
                          }
                        />
                      </div>
                    )}

                  </div>
                )
              )
            )}

          </section>

        ) : (

          <section className="kanban-board">

            <div className="kanban-column">

              <div className="kanban-column-header">
                <h2>
                  To Do
                </h2>

                <span>
                  {
                    todoTasks.length
                  }
                </span>
              </div>

              <div className="kanban-column-content">

                {todoTasks.length ===
                0 ? (
                  <p className="empty-column">
                    No tasks
                  </p>
                ) : (
                  todoTasks.map(
                    renderKanbanCard
                  )
                )}

              </div>

            </div>

            <div className="kanban-column">

              <div className="kanban-column-header">
                <h2>
                  In Progress
                </h2>

                <span>
                  {
                    inProgressTasks.length
                  }
                </span>
              </div>

              <div className="kanban-column-content">

                {inProgressTasks.length ===
                0 ? (
                  <p className="empty-column">
                    No tasks
                  </p>
                ) : (
                  inProgressTasks.map(
                    renderKanbanCard
                  )
                )}

              </div>

            </div>

            <div className="kanban-column">

              <div className="kanban-column-header">
                <h2>
                  Completed
                </h2>

                <span>
                  {
                    completedTasks.length
                  }
                </span>
              </div>

              <div className="kanban-column-content">

                {completedTasks.length ===
                0 ? (
                  <p className="empty-column">
                    No tasks
                  </p>
                ) : (
                  completedTasks.map(
                    renderKanbanCard
                  )
                )}

              </div>

            </div>

          </section>
        )}

      </main>

      {/* CREATE TASK */}

      {showTaskForm && (
        <TaskForm
          onCreated={
            handleTaskCreated
          }
          onCancel={() =>
            setShowTaskForm(
              false
            )
          }
        />
      )}

      {/* EDIT TASK */}

      {editingTask && (
        <TaskForm
          task={
            editingTask
          }
          onUpdated={
            handleTaskUpdated
          }
          onCancel={() =>
            setEditingTask(
              null
            )
          }
        />
      )}

    </>
  );
}

export default Tasks;