import { useEffect, useState } from "react";

import {
  getProjects,
  getTasks,
  getMe,
} from "./api";

import TaskForm from "./TaskForm";

function Dashboard({ onOpenProject }) {
  const [tasks, setTasks] = useState([]);

  const [project, setProject] =
    useState(null);

  const [userName, setUserName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [projectLoading, setProjectLoading] =
    useState(true);

  const [showTaskForm, setShowTaskForm] =
    useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setProjectLoading(true);

    try {
      const [
        tasksData,
        projectsData,
        userData,
      ] = await Promise.all([
        getTasks(),
        getProjects(),
        getMe(),
      ]);

      setTasks(
        tasksData.results ||
          tasksData ||
          []
      );

      const projects =
        projectsData.results ||
        projectsData ||
        [];

      const taskFlowProject =
        projects.find(
          (item) =>
            item.name ===
            "TaskFlow Hackathon Project"
        );

      setProject(
        taskFlowProject ||
          projects[0] ||
          null
      );

      /*
       * Use the user's first name from signup.
       * If first_name is empty, fall back to username.
       */
      setUserName(
        userData?.first_name?.trim() ||
          userData?.username ||
          "User"
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setProjectLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleTaskCreated = async () => {
    setShowTaskForm(false);

    await loadDashboard();
  };

  const totalTasks =
    tasks.length;

  const todoTasks =
    tasks.filter(
      (task) =>
        task.status === "TODO"
    ).length;

  const inProgressTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "IN_PROGRESS"
    ).length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "DONE"
    ).length;

  const handleViewProject = () => {
    if (
      project &&
      onOpenProject
    ) {
      onOpenProject(
        project.id
      );
    }
  };

  return (
    <>
      <main className="dashboard">

        <div className="dashboard-header">

          <div>
            <h1>
              Dashboard
            </h1>

            <p>
              Welcome back,{" "}
              {userName || "User"}.
            </p>
          </div>

          {/* 
           * Keep New Task visible for everyone.
           * TaskForm itself now filters the project
           * list to projects owned by the user.
           */}
          <button
            className="primary-button"
            onClick={() =>
              setShowTaskForm(true)
            }
          >
            + New Task
          </button>

        </div>

        <section className="stats-grid">

          <div className="stat-card">
            <span>
              Total Tasks
            </span>

            <strong>
              {loading
                ? "—"
                : totalTasks}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              To Do
            </span>

            <strong>
              {loading
                ? "—"
                : todoTasks}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              In Progress
            </span>

            <strong>
              {loading
                ? "—"
                : inProgressTasks}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Completed
            </span>

            <strong>
              {loading
                ? "—"
                : completedTasks}
            </strong>
          </div>

        </section>

        <section className="project-section">

          <div className="section-header">

            <div>
              <h2>
                {project?.name ||
                  "TaskFlow Hackathon Project"}
              </h2>

              <p>
                {project?.description ||
                  "Collaborative project management platform for our hackathon."}
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={
                handleViewProject
              }
              disabled={
                projectLoading ||
                !project
              }
            >
              {projectLoading
                ? "Loading..."
                : "View Project"}
            </button>

          </div>

          <div className="task-preview">

            {loading ? (

              <div className="task-row">
                <p>
                  Loading tasks...
                </p>
              </div>

            ) : tasks.length === 0 ? (

              <div className="task-row">
                <p>
                  No tasks found.
                </p>
              </div>

            ) : (

              tasks.map(
                (task) => (
                  <div
                    className="task-row"
                    key={task.id}
                  >

                    <div>

                      <strong>
                        {task.title}
                      </strong>

                      <p>
                        Assigned to{" "}
                        {task
                          .assigned_to
                          ?.username ||
                          "Unassigned"}
                      </p>

                    </div>

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
                      {
                        task.status_display
                      }
                    </span>

                  </div>
                )
              )

            )}

          </div>

        </section>

      </main>

      {showTaskForm && (
        <TaskForm
          onCreated={
            handleTaskCreated
          }
          onCancel={() =>
            setShowTaskForm(false)
          }
        />
      )}
    </>
  );
}

export default Dashboard;