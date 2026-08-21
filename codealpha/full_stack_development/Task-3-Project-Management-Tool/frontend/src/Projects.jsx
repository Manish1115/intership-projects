import { useEffect, useState } from "react";
import { getProjects } from "./api";
import ProjectDetails from "./ProjectDetails";
import ProjectForm from "./ProjectForm";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProjectId, setSelectedProjectId] =
    useState(null);

  const [showProjectForm, setShowProjectForm] =
    useState(false);

  const loadProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getProjects();

      setProjects(data.results || data || []);
    } catch (error) {
      console.error(error);

      if (error.message !== "SESSION_EXPIRED") {
        setError(
          error.message || "Unable to load projects."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectCreated = async () => {
    setShowProjectForm(false);
    await loadProjects();
  };

  if (selectedProjectId !== null) {
    return (
      <ProjectDetails
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  return (
    <>
      <main className="dashboard projects-page">
        <div className="dashboard-header projects-hero">
          <div>
            <span className="page-eyebrow">
              WORKSPACE
            </span>

            <h1>Projects</h1>

            <p>
              Organize work, collaborate with your team,
              and keep every project moving forward.
            </p>
          </div>

          <button
            className="primary-button projects-create-button"
            onClick={() => setShowProjectForm(true)}
          >
            <span className="button-plus">+</span>
            New Project
          </button>
        </div>

        {!loading && !error && projects.length > 0 && (
          <div className="projects-summary">
            <div className="projects-summary-card">
              <div className="summary-icon">◈</div>

              <div>
                <span>Total Projects</span>
                <strong>{projects.length}</strong>
              </div>
            </div>

            <div className="projects-summary-card">
              <div className="summary-icon">◆</div>

              <div>
                <span>Active Workspace</span>
                <strong>Ready</strong>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <section className="projects-grid">
            {[1, 2, 3].map((item) => (
              <article
                className="project-card project-card-skeleton"
                key={item}
              >
                <div className="skeleton-line skeleton-small" />
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-description" />
                <div className="skeleton-line skeleton-description short" />

                <div className="skeleton-meta">
                  <div />
                  <div />
                </div>

                <div className="skeleton-button" />
              </article>
            ))}
          </section>
        ) : error ? (
          <section className="project-section projects-state-card">
            <div className="state-icon">!</div>

            <h2>Unable to load projects</h2>

            <p>{error}</p>

            <button
              className="primary-button"
              onClick={loadProjects}
            >
              Try Again
            </button>
          </section>
        ) : projects.length === 0 ? (
          <section className="project-section projects-empty-card">
            <div className="empty-project-icon">
              +
            </div>

            <span className="page-eyebrow">
              GET STARTED
            </span>

            <h2>No projects yet</h2>

            <p>
              Create your first project and start
              organizing your work with TaskFlow.
            </p>

            <button
              className="primary-button"
              onClick={() => setShowProjectForm(true)}
            >
              Create Your First Project
            </button>
          </section>
        ) : (
          <section className="projects-grid">
            {projects.map((project) => (
              <article
                className="project-card"
                key={project.id}
              >
                <div className="project-card-glow" />

                <div className="project-card-header">
                  <div className="project-title-wrapper">
                    <div className="project-icon">
                      {project.name
                        ?.charAt(0)
                        ?.toUpperCase() || "P"}
                    </div>

                    <div>
                      <span className="project-id">
                        PROJECT #{project.id}
                      </span>

                      <h2>{project.name}</h2>
                    </div>
                  </div>

                  <span className="project-status">
                    Active
                  </span>
                </div>

                <p className="project-description">
                  {project.description ||
                    "No project description available."}
                </p>

                <div className="project-card-divider" />

                <div className="project-card-meta">
                  <div className="project-meta-item">
                    <span>OWNER</span>

                    <strong>
                      <span className="owner-avatar">
                        {project.owner?.username
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </span>

                      {project.owner?.username ||
                        "Unknown"}
                    </strong>
                  </div>

                  <div className="project-meta-item">
                    <span>MEMBERS</span>

                    <strong>
                      <span className="member-count">
                        {project.members?.length || 0}
                      </span>

                      people
                    </strong>
                  </div>
                </div>

                <button
                  className="primary-button project-open-button"
                  onClick={() =>
                    setSelectedProjectId(project.id)
                  }
                >
                  Open Project
                  <span className="project-open-arrow">
                    →
                  </span>
                </button>
              </article>
            ))}
          </section>
        )}
      </main>

      {showProjectForm && (
        <ProjectForm
          onCreated={handleProjectCreated}
          onCancel={() => setShowProjectForm(false)}
        />
      )}
    </>
  );
}

export default Projects;