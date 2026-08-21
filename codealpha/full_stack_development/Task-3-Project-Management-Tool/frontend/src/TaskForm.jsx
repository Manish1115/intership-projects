import { useEffect, useState } from "react";
import {
  createTask,
  updateTask,
  getProjects,
  getMe,
} from "./api";

function TaskForm({
  task = null,
  project = null,
  onCreated,
  onUpdated,
  onCancel,
}) {
  const isEditing = Boolean(task);

  const [projects, setProjects] = useState([]);

  const [selectedProjectId, setSelectedProjectId] =
    useState(
      task?.project
        ? String(task.project)
        : project?.id
          ? String(project.id)
          : ""
    );

  const [title, setTitle] = useState(
    task?.title || ""
  );

  const [description, setDescription] = useState(
    task?.description || ""
  );

  const [priority, setPriority] = useState(
    task?.priority || "MEDIUM"
  );

  const [status, setStatus] = useState(
    task?.status || "TODO"
  );

  const [dueDate, setDueDate] = useState(
    task?.due_date
      ? task.due_date.slice(0, 16)
      : ""
  );

  // MULTIPLE ASSIGNEES
  const [assignedTo, setAssignedTo] = useState(
    task?.assigned_to?.map((user) =>
      String(user.id)
    ) || []
  );

  const [assigneeSearch, setAssigneeSearch] =
    useState("");

  const [assigneeDropdownOpen, setAssigneeDropdownOpen] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [loadingProjects, setLoadingProjects] =
    useState(!project && !task);

  const [error, setError] = useState("");

  /*
   * LOAD PROJECTS
   */
  useEffect(() => {
    if (project) {
      setProjects([project]);

      setSelectedProjectId(
        String(project.id)
      );

      return;
    }

    const loadProjects = async () => {
      setLoadingProjects(true);
      setError("");

      try {
        const [projectsData, meData] =
          await Promise.all([
            getProjects(),
            getMe(),
          ]);

        const projectList =
          projectsData.results ||
          projectsData ||
          [];

        const ownedProjects =
          projectList.filter(
            (item) =>
              Number(item.owner?.id) ===
              Number(meData.id)
          );

        setProjects(ownedProjects);

        if (task?.project) {
          setSelectedProjectId(
            String(task.project)
          );
        } else if (
          ownedProjects.length > 0
        ) {
          setSelectedProjectId(
            String(ownedProjects[0].id)
          );
        } else {
          setSelectedProjectId("");
        }
      } catch (error) {
        console.error(error);

        if (
          error.message ===
          "SESSION_EXPIRED"
        ) {
          setError(
            "Your session has expired."
          );
        } else {
          setError(
            error.message ||
              "Unable to load projects."
          );
        }
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [project, task]);

  /*
   * SELECTED PROJECT
   */
  const selectedProject =
    projects.find(
      (item) =>
        String(item.id) ===
        String(selectedProjectId)
    ) || project;

  /*
   * PROJECT MEMBERS
   */
  const projectMembers =
    selectedProject?.members || [];

  /*
   * SEARCH MEMBERS
   */
  const filteredMembers =
    projectMembers
      .filter((member) =>
        member.username
          .toLowerCase()
          .includes(
            assigneeSearch
              .trim()
              .toLowerCase()
          )
      )
      .slice(0, 5);

  /*
   * REMOVE USERS WHO ARE NO LONGER
   * MEMBERS OF THE SELECTED PROJECT
   */
  useEffect(() => {
    const validIds =
      projectMembers.map((member) =>
        String(member.id)
      );

    setAssignedTo((current) =>
      current.filter((id) =>
        validIds.includes(String(id))
      )
    );
  }, [selectedProject, projectMembers]);

  /*
   * ADD / REMOVE ASSIGNEE
   */
  const toggleAssignee = (memberId) => {
    const id = String(memberId);

    setAssignedTo((current) => {
      if (current.includes(id)) {
        return current.filter(
          (item) => item !== id
        );
      }

      return [...current, id];
    });
  };

  /*
   * SUBMIT
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (
        !isEditing &&
        !selectedProjectId
      ) {
        throw new Error(
          "Please select a project."
        );
      }

      const taskData = {
        title,
        description,
        priority,
        status,
        due_date: dueDate
          ? dueDate
          : null,

        // MULTIPLE USER IDS
        assigned_to_ids:
          assignedTo.map((id) =>
            Number(id)
          ),
      };

      if (!isEditing) {
        taskData.project =
          Number(selectedProjectId);
      }

      let result;

      if (isEditing) {
        result = await updateTask(
          task.id,
          taskData
        );

        onUpdated(result);
      } else {
        result = await createTask(
          taskData
        );

        onCreated(result);
      }
    } catch (error) {
      console.error(error);

      if (
        error.message ===
        "SESSION_EXPIRED"
      ) {
        setError(
          "Your session has expired."
        );
      } else {
        setError(
          error.message ||
            "Unable to save task."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * SELECTED USER OBJECTS
   */
  const selectedMembers =
    projectMembers.filter((member) =>
      assignedTo.includes(
        String(member.id)
      )
    );

  return (
    <div className="modal-overlay">
      <div className="modal-card">

        <div className="modal-header">
          <div>
            <h2>
              {isEditing
                ? "Edit Task"
                : "Create New Task"}
            </h2>

            <p>
              {isEditing
                ? "Update the task details."
                : "Add a task to your project."}
            </p>
          </div>

          <button
            className="modal-close"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <form
          className="task-form"
          onSubmit={handleSubmit}
        >

          {!isEditing && (
            <>
              <label>
                Project
              </label>

              {loadingProjects ? (
                <p>
                  Loading projects...
                </p>
              ) : projects.length === 0 ? (
                <div className="form-error">
                  You don't own any projects.
                  Only project owners can
                  create tasks.
                </div>
              ) : (
                <select
                  value={
                    selectedProjectId
                  }
                  onChange={(event) => {
                    setSelectedProjectId(
                      event.target.value
                    );

                    setAssignedTo([]);

                    setAssigneeSearch("");

                    setAssigneeDropdownOpen(
                      false
                    );
                  }}
                  required
                >
                  <option value="">
                    Select a project
                  </option>

                  {projects.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {isEditing && (
            <div className="task-form-project">
              <label>
                Project
              </label>

              <input
                type="text"
                value={
                  task?.project_name ||
                  selectedProject?.name ||
                  ""
                }
                disabled
              />
            </div>
          )}

          <label>
            Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="Enter task title"
            required
          />

          <label>
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Describe the task"
            rows="4"
          />

          <label>
            Status
          </label>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
          >
            <option value="TODO">
              To Do
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="DONE">
              Completed
            </option>
          </select>

          <label>
            Priority
          </label>

          <select
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value
              )
            }
          >
            <option value="LOW">
              Low
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="URGENT">
              Urgent
            </option>
          </select>

          {/* =========================================
              ASSIGN MULTIPLE USERS
              ========================================= */}

          <label>
            Assign To
          </label>

          <div className="assignee-autocomplete">

            {/* SELECTED USERS */}
            {selectedMembers.length > 0 && (
              <div className="selected-assignees">

                {selectedMembers.map(
                  (member) => (
                    <div
                      className="selected-assignee"
                      key={member.id}
                    >
                      <span className="assignee-avatar">
                        {member.username
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span>
                        {member.username}
                      </span>

                      <button
                        type="button"
                        className="selected-assignee-remove"
                        onClick={() =>
                          toggleAssignee(
                            member.id
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  )
                )}

              </div>
            )}

            <div className="assignee-search-wrapper">

              <span className="assignee-search-icon">
                🔍
              </span>

              <input
                type="text"
                value={assigneeSearch}
                onChange={(event) => {
                  setAssigneeSearch(
                    event.target.value
                  );

                  setAssigneeDropdownOpen(
                    true
                  );
                }}
                onFocus={() =>
                  setAssigneeDropdownOpen(
                    true
                  )
                }
                placeholder={
                  selectedMembers.length > 0
                    ? "Add another member..."
                    : "Search member..."
                }
                autoComplete="off"
              />

              {assigneeSearch && (
                <button
                  type="button"
                  className="assignee-clear"
                  onClick={() => {
                    setAssigneeSearch("");

                    setAssigneeDropdownOpen(
                      true
                    );
                  }}
                >
                  ×
                </button>
              )}

            </div>

            {assigneeDropdownOpen && (
              <div className="assignee-results">

                {assigneeSearch.trim() === "" ? (
                  <div className="assignee-hint">
                    Start typing a username...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="assignee-hint">
                    No members found.
                  </div>
                ) : (
                  filteredMembers.map(
                    (member) => {
                      const selected =
                        assignedTo.includes(
                          String(member.id)
                        );

                      return (
                        <button
                          type="button"
                          key={member.id}
                          className={
                            selected
                              ? "assignee-result selected"
                              : "assignee-result"
                          }
                          onClick={() =>
                            toggleAssignee(
                              member.id
                            )
                          }
                        >
                          <span className="assignee-avatar">
                            {member.username
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <span className="assignee-name">
                            {member.username}
                          </span>

                          {selected && (
                            <span className="assignee-selected-check">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    }
                  )
                )}

              </div>
            )}

          </div>

          <label>
            Due Date
          </label>

          <input
            type="datetime-local"
            value={dueDate}
            onChange={(event) =>
              setDueDate(
                event.target.value
              )
            }
          />

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                loading ||
                loadingProjects ||
                (
                  !isEditing &&
                  projects.length === 0
                )
              }
            >
              {loading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Task"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default TaskForm;