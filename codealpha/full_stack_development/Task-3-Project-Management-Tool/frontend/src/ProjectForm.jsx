import { useEffect, useState } from "react";
import {
  createProject,
  updateProject,
} from "./api";

function ProjectForm({
  project = null,
  onCreated,
  onUpdated,
  onCancel,
}) {
  const isEditing = Boolean(project);

  const [name, setName] = useState(
    project?.name || ""
  );

  const [description, setDescription] =
    useState(project?.description || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(project?.name || "");
    setDescription(project?.description || "");
    setError("");
  }, [project]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setError(
        "Project name must contain at least 2 characters."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isEditing) {
        const updatedProject =
          await updateProject(project.id, {
            name: trimmedName,
            description: trimmedDescription,
          });

        if (onUpdated) {
          onUpdated(updatedProject);
        }
      } else {
        const newProject = await createProject({
          name: trimmedName,
          description: trimmedDescription,
        });

        if (onCreated) {
          onCreated(newProject);
        }
      }
    } catch (error) {
      console.error(error);

      if (error.message !== "SESSION_EXPIRED") {
        setError(
          error.message ||
            `Unable to ${
              isEditing ? "update" : "create"
            } project.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay project-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >
      <div
        className="modal project-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="project-modal-decoration" />

        <div className="modal-header project-modal-header">
          <div>
            <span className="page-eyebrow">
              {isEditing
                ? "PROJECT SETTINGS"
                : "NEW WORKSPACE"}
            </span>

            <h2>
              {isEditing
                ? "Edit Project"
                : "Create Project"}
            </h2>

            <p>
              {isEditing
                ? "Update your project information."
                : "Set up a new workspace for your team."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close project-modal-close"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          className="task-form project-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="form-error project-form-error">
              <span>!</span>
              {error}
            </div>
          )}

          <div className="form-group project-form-group">
            <label htmlFor="project-name">
              Project Name
            </label>

            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. Website Redesign"
              disabled={loading}
              autoFocus
              maxLength={100}
            />

            <span className="field-hint">
              Give your project a clear, recognizable
              name.
            </span>
          </div>

          <div className="form-group project-form-group">
            <label htmlFor="project-description">
              Description
              <span className="optional-label">
                Optional
              </span>
            </label>

            <textarea
              id="project-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="What is this project about?"
              rows="5"
              disabled={loading}
              maxLength={500}
            />

            <span className="field-hint description-counter">
              {description.length}/500
            </span>
          </div>

          <div className="project-form-preview">
            <div className="preview-icon">
              {name
                ?.charAt(0)
                ?.toUpperCase() || "P"}
            </div>

            <div>
              <span>PROJECT PREVIEW</span>

              <strong>
                {name.trim() || "Your project name"}
              </strong>

              <p>
                {description.trim() ||
                  "Your project description will appear here."}
              </p>
            </div>
          </div>

          <div className="modal-actions project-modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button project-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  {isEditing
                    ? "Saving..."
                    : "Creating..."}
                </>
              ) : (
                <>
                  {isEditing
                    ? "Save Changes"
                    : "Create Project"}

                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;