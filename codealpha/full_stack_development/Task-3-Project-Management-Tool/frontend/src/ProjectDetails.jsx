import { useEffect, useState } from "react";
import {
  getProjects,
  getTasks,
  getUsers,
  getMe,
  updateProject,
  updateTask,
  deleteTask,
} from "./api";
import ProjectForm from "./ProjectForm";
import TaskForm from "./TaskForm";
import Comments from "./Comments";

function ProjectDetails({
  projectId,
  onBack,
}) {
  const [project, setProject] =
    useState(null);

  const [tasks, setTasks] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [memberSearch, setMemberSearch] =
    useState("");

  const [currentUser, setCurrentUser] =
    useState(null);

  const [
    selectedMemberIds,
    setSelectedMemberIds,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [membersLoading, setMembersLoading] =
    useState(true);

  const [savingMembers, setSavingMembers] =
    useState(false);

  const [showProjectForm, setShowProjectForm] =
    useState(false);

  const [showTaskForm, setShowTaskForm] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);

  const [commentTaskId, setCommentTaskId] =
    useState(null);

  const [updatingTaskId, setUpdatingTaskId] =
    useState(null);

  const [deletingTaskId, setDeletingTaskId] =
    useState(null);

  const [openStatusTaskId, setOpenStatusTaskId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [memberError, setMemberError] =
    useState("");

  const [memberSuccess, setMemberSuccess] =
    useState("");

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          projectsData,
          tasksData,
          meData,
        ] = await Promise.all([
          getProjects(),
          getTasks({
            project: projectId,
          }),
          getMe(),
        ]);

        const projects =
          projectsData.results ||
          projectsData ||
          [];

        const selectedProject =
          projects.find(
            (item) =>
              item.id === projectId
          );

        if (!selectedProject) {
          throw new Error(
            "Project not found."
          );
        }

        setProject(
          selectedProject
        );

        setTasks(
          tasksData.results ||
            tasksData ||
            []
        );

        setCurrentUser(meData);

        setSelectedMemberIds(
          (
            selectedProject.members ||
            []
          ).map(
            (member) => member.id
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
              "Unable to load project."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const isOwner =
    currentUser &&
    project &&
    currentUser.id ===
      project.owner?.id;

  const savedMemberIds =
    (project?.members || [])
      .map((member) => member.id)
      .sort((a, b) => a - b);

  const currentMemberIds =
    [...selectedMemberIds]
      .sort((a, b) => a - b);

  const hasMemberChanges =
    savedMemberIds.length !==
      currentMemberIds.length ||
    savedMemberIds.some(
      (id, index) =>
        id !== currentMemberIds[index]
    );

  const filteredMemberUsers =
    users
      .filter((user) =>
        user.username
          .toLowerCase()
          .includes(
            memberSearch
              .toLowerCase()
              .trim()
          )
      )
      .slice(0, 5);

  useEffect(() => {
    const loadUsers = async () => {
      setMembersLoading(true);
      setMemberError("");

      try {
        const data =
          await getUsers();

        setUsers(
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
          setMemberError(
            error.message ||
              "Unable to load users."
          );
        }
      } finally {
        setMembersLoading(false);
      }
    };

    loadUsers();
  }, []);

  const refreshTasks = async () => {
    try {
      const data =
        await getTasks({
          project: projectId,
        });

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
          error.message ||
            "Unable to refresh tasks."
        );
      }
    }
  };

  const handleMemberToggle = (
    userId
  ) => {
    if (!isOwner) {
      return;
    }

    setMemberSuccess("");
    setMemberError("");

    setSelectedMemberIds(
      (currentIds) => {
        if (
          currentIds.includes(userId)
        ) {
          return currentIds.filter(
            (id) => id !== userId
          );
        }

        return [
          ...currentIds,
          userId,
        ];
      }
    );

    // Clear search after selecting/unselecting
    setMemberSearch("");
  };

  const handleSaveMembers = async () => {
    if (!project || !isOwner) {
      return;
    }

    setSavingMembers(true);
    setMemberError("");
    setMemberSuccess("");

    try {
      const updatedProject =
        await updateProject(
          project.id,
          {
            member_ids:
              selectedMemberIds,
          }
        );

      setProject(
        updatedProject
      );

      setSelectedMemberIds(
        (
          updatedProject.members ||
          []
        ).map(
          (member) =>
            member.id
        )
      );

      setMemberSuccess(
        "Project members updated successfully."
      );
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setMemberError(
          error.message ||
            "Unable to update project members."
        );
      }
    } finally {
      setSavingMembers(false);
    }
  };

  const handleProjectUpdated = (
    updatedProject
  ) => {
    setProject(
      updatedProject
    );

    setShowProjectForm(false);
  };

  const handleTaskCreated = async () => {
    setShowTaskForm(false);

    await refreshTasks();
  };

  const handleTaskUpdated = async () => {
    setEditingTask(null);

    await refreshTasks();
  };

  const handleStatusChange = async (
    task,
    newStatus
  ) => {
    if (task.status === newStatus) {
      return;
    }

    /*
     * Non-owners can only move unfinished
     * tasks between TODO and IN_PROGRESS.
     */
    if (!isOwner) {
      if (task.status === "DONE") {
        setError(
          "Completed tasks can only be changed by the project owner."
        );

        return;
      }

      if (newStatus === "DONE") {
        setError(
          "Only the project owner can mark a task as completed."
        );

        return;
      }

      if (
        newStatus !== "TODO" &&
        newStatus !== "IN_PROGRESS"
      ) {
        setError(
          "You do not have permission to use this status."
        );

        return;
      }
    }

    setUpdatingTaskId(task.id);
    setError("");

    try {
      await updateTask(
        task.id,
        {
          status: newStatus,
        }
      );

      await refreshTasks();
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          error.message ||
            "Unable to update task status."
        );
      }
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDelete = async (
    task
  ) => {
    if (!isOwner) {
      setError(
        "Only the project owner can delete tasks."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${task.title}"?`
      );

    if (!confirmed) {
      return;
    }

    setDeletingTaskId(task.id);
    setError("");

    try {
      await deleteTask(task.id);

      if (
        commentTaskId === task.id
      ) {
        setCommentTaskId(null);
      }

      await refreshTasks();
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
      setDeletingTaskId(null);
    }
  };

  const handleStatusDropdown = (
    taskId
  ) => {
    setOpenStatusTaskId(
      (currentId) =>
        currentId === taskId
          ? null
          : taskId
    );
  };

  const renderTaskCard = (
    task
  ) => (
    <article
      className="kanban-card"
      key={task.id}
    >
      <div className="kanban-card-header">
        <h3>
          {task.title}
        </h3>

        <span
          className={`status ${
            task.status ===
            "IN_PROGRESS"
              ? "in-progress"
              : task.status ===
                  "DONE"
                ? "completed"
                : "todo"
          }`}
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
            {task.priority_display}
          </strong>
        </span>

        <span>
          Assigned:{" "}
          <strong>
            {task.assigned_to
              ?.username ||
              "Unassigned"}
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

      <div className="custom-status-dropdown">
        <button
          type="button"
          className={`kanban-status-select ${
            task.status === "DONE"
              ? "status-select-completed"
              : task.status === "IN_PROGRESS"
                ? "status-select-progress"
                : "status-select-todo"
          }`}
          disabled={
            updatingTaskId === task.id ||
            (!isOwner &&
              task.status === "DONE")
          }
          onClick={() =>
            handleStatusDropdown(
              task.id
            )
          }
        >
          <span>
            {task.status === "DONE"
              ? "Completed"
              : task.status ===
                  "IN_PROGRESS"
                ? "In Progress"
                : "To Do"}
          </span>

          <span className="status-dropdown-arrow">
            {openStatusTaskId ===
            task.id
              ? "⌃"
              : "⌄"}
          </span>
        </button>

        {openStatusTaskId ===
          task.id && (
          <div className="status-dropdown-menu">
            <button
              type="button"
              className={
                task.status === "TODO"
                  ? "status-option active"
                  : "status-option"
              }
              onClick={() => {
                setOpenStatusTaskId(
                  null
                );

                handleStatusChange(
                  task,
                  "TODO"
                );
              }}
            >
              <span className="status-option-dot todo-dot" />
              To Do
            </button>

            <button
              type="button"
              className={
                task.status ===
                "IN_PROGRESS"
                  ? "status-option active"
                  : "status-option"
              }
              onClick={() => {
                setOpenStatusTaskId(
                  null
                );

                handleStatusChange(
                  task,
                  "IN_PROGRESS"
                );
              }}
            >
              <span className="status-option-dot progress-dot" />
              In Progress
            </button>

            {isOwner && (
              <button
                type="button"
                className={
                  task.status === "DONE"
                    ? "status-option active"
                    : "status-option"
                }
                onClick={() => {
                  setOpenStatusTaskId(
                    null
                  );

                  handleStatusChange(
                    task,
                    "DONE"
                  );
                }}
              >
                <span className="status-option-dot completed-dot" />
                Completed
              </button>
            )}
          </div>
        )}
      </div>

      <div className="kanban-actions">
        {isOwner && (
          <>
            <button
              className="edit-button"
              onClick={() =>
                setEditingTask(task)
              }
            >
              Edit
            </button>

            <button
              className="delete-button"
              onClick={() =>
                handleDelete(task)
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
          </>
        )}

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
      </div>

      {commentTaskId ===
        task.id && (
        <Comments
          taskId={task.id}
        />
      )}
    </article>
  );

  if (loading) {
    return (
      <main className="dashboard">
        <div className="project-section">
          <div className="task-row">
            <p>
              Loading project...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !project) {
    return (
      <main className="dashboard">
        <div className="dashboard-header">
          <button
            className="secondary-button"
            onClick={onBack}
          >
            Back to Projects
          </button>

          <h1>
            Project Error
          </h1>
        </div>

        <section className="project-section">
          <div className="task-row">
            <p>
              {error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  const todoTasks =
    tasks.filter(
      (task) =>
        task.status === "TODO"
    );

  const inProgressTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "IN_PROGRESS"
    );

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "DONE"
    );

  return (
    <>
      <main className="dashboard">
        <div className="dashboard-header">
          <div>
            <button
              className="secondary-button"
              onClick={onBack}
            >
              Back to Projects
            </button>

            <h1>
              {project.name}
            </h1>

            <p>
              {project.description ||
                "No project description available."}
            </p>
          </div>

          <div className="dashboard-header-actions">
            {isOwner && (
              <>
                <button
                  className="primary-button"
                  onClick={() =>
                    setShowProjectForm(
                      true
                    )
                  }
                >
                  Edit Project
                </button>

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
              </>
            )}
          </div>
        </div>

        {error && (
          <section className="project-section">
            <div className="form-error">
              {error}
            </div>
          </section>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <span>
              Total Tasks
            </span>

            <strong>
              {tasks.length}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              To Do
            </span>

            <strong>
              {todoTasks.length}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              In Progress
            </span>

            <strong>
              {inProgressTasks.length}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Completed
            </span>

            <strong>
              {completedTasks.length}
            </strong>
          </div>
        </section>

        <section className="project-section">
          <div className="section-header">
            <div>
              <h2>
                Project Information
              </h2>

              <p>
                Details about this project.
              </p>
            </div>
          </div>

          <div className="project-info-grid">
            <div>
              <span>
                Project ID
              </span>

              <strong>
                #{project.id}
              </strong>
            </div>

            <div>
              <span>
                Owner
              </span>

              <strong>
                {project.owner
                  ?.username ||
                  "Unknown"}
              </strong>
            </div>

            <div>
              <span>
                Members
              </span>

              <strong>
                {project.members
                  ?.length || 0}
              </strong>
            </div>
          </div>
        </section>

        <section className="project-section">
          <div className="section-header">
            <div>
              <h2>
                Project Members
              </h2>

              <p>
                {isOwner
                  ? "Manage who has access to this project."
                  : "Members of this project."}
              </p>
            </div>
          </div>

          {membersLoading ? (
            <div className="task-row">
              <p>
                Loading users...
              </p>
            </div>
          ) : memberError ? (
            <div className="task-row">
              <p>
                {memberError}
              </p>
            </div>
          ) : (
            <>
              <div className="member-search-wrapper">
                <input
                  type="text"
                  className="member-search-input"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(event) =>
                    setMemberSearch(
                      event.target.value
                    )
                  }
                />

                {selectedMemberIds.length >
                  0 && (
                  <>
                    <div className="member-section-title">
                      Project Members
                    </div>

                    <div className="member-list">
                      {users
                        .filter((user) =>
                          selectedMemberIds.includes(
                            user.id
                          )
                        )
                        .map((user) => (
                          <label
                            className="member-option"
                            key={user.id}
                          >
                            <input
                              type="checkbox"
                              checked={true}
                              disabled={
                                !isOwner ||
                                user.id ===
                                  project.owner
                                    ?.id
                              }
                              onChange={() =>
                                handleMemberToggle(
                                  user.id
                                )
                              }
                            />

                            <span>
                              {
                                user.username
                              }
                            </span>

                            {project.owner
                              ?.id ===
                              user.id && (
                              <small>
                                Owner
                              </small>
                            )}
                          </label>
                        ))}
                    </div>
                  </>
                )}

                {memberSearch.trim() && (
                  <>
                    <div className="member-section-title">
                      Search Results
                    </div>

                    <div className="member-search-results">
                      {filteredMemberUsers.length ===
                      0 ? (
                        <div className="member-search-empty">
                          No members found.
                        </div>
                      ) : (
                        filteredMemberUsers.map(
                          (user) => {
                            const selected =
                              selectedMemberIds.includes(
                                user.id
                              );

                            return (
                              <label
                                className="member-option"
                                key={user.id}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    selected
                                  }
                                  disabled={
                                    !isOwner ||
                                    user.id ===
                                      project
                                        .owner
                                        ?.id
                                  }
                                  onChange={() =>
                                    handleMemberToggle(
                                      user.id
                                    )
                                  }
                                />

                                <span>
                                  {
                                    user.username
                                  }
                                </span>

                                {project.owner
                                  ?.id ===
                                  user.id && (
                                  <small>
                                    Owner
                                  </small>
                                )}
                              </label>
                            );
                          }
                        )
                      )}
                    </div>
                  </>
                )}
              </div>

              {isOwner && (
                <>
                  {memberSuccess && (
                    <p className="form-success">
                      {memberSuccess}
                    </p>
                  )}

                  {memberError && (
                    <p className="form-error">
                      {memberError}
                    </p>
                  )}

                  {hasMemberChanges && (
                    <div className="modal-actions">
                      <button
                        className="primary-button"
                        onClick={
                          handleSaveMembers
                        }
                        disabled={
                          savingMembers
                        }
                      >
                        {savingMembers
                          ? "Saving..."
                          : "Save Members"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {!isOwner && (
                <p>
                  Only the project
                  owner can manage
                  members.
                </p>
              )}
            </>
          )}
        </section>

        <section className="project-section">
          <div className="section-header">
            <div>
              <h2>
                Project Board
              </h2>

              <p>
                Manage tasks and track
                project progress.
              </p>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="task-row">
              <p>
                No tasks in this
                project.
              </p>
            </div>
          ) : (
            <section className="kanban-board">
              <div className="kanban-column">
                <div className="kanban-column-header">
                  <h2>
                    To Do
                  </h2>

                  <span>
                    {todoTasks.length}
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
                      renderTaskCard
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
                      renderTaskCard
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
                      renderTaskCard
                    )
                  )}
                </div>
              </div>
            </section>
          )}
        </section>
      </main>

      {showProjectForm && (
        <ProjectForm
          project={project}
          onUpdated={
            handleProjectUpdated
          }
          onCancel={() =>
            setShowProjectForm(false)
          }
        />
      )}

      {showTaskForm && (
        <TaskForm
          project={project}
          onCreated={
            handleTaskCreated
          }
          onCancel={() =>
            setShowTaskForm(false)
          }
        />
      )}

      {editingTask && (
        <TaskForm
          task={editingTask}
          onUpdated={
            handleTaskUpdated
          }
          onCancel={() =>
            setEditingTask(null)
          }
        />
      )}
    </>
  );
}

export default ProjectDetails;