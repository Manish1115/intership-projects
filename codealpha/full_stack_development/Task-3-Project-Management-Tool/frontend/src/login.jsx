import { useState } from "react";
import { apiRequest } from "./api";

function Login({
  onLogin,
  onSignup,
}) {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data =
        await apiRequest(
          "/auth/login/",
          {
            method: "POST",
            body: JSON.stringify({
              username,
              password,
            }),
          }
        );

      localStorage.setItem(
        "access_token",
        data.access
      );

      if (data.refresh) {
        localStorage.setItem(
          "refresh_token",
          data.refresh
        );
      }

      onLogin();
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">

        <div className="login-brand">

          <div className="login-brand-logo">
            TaskFlow
          </div>

          <div className="login-brand-content">

            <span className="page-eyebrow login-eyebrow">
              PRODUCTIVITY • COLLABORATION
            </span>

            <h1>
              Get things done.
              <br />
              Stay in flow.
            </h1>

            <p>
              Manage projects, organize
              tasks, collaborate with your
              team, and keep everything
              moving from one workspace.
            </p>

          </div>

          <div className="login-feature-list">

            <div className="login-feature">
              <span className="login-feature-icon">
                ✓
              </span>

              Organize your projects
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">
                ✓
              </span>

              Track tasks effortlessly
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">
                ✓
              </span>

              Stay notified in real time
            </div>

          </div>

        </div>

        <div className="login-form-container">

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            <div className="login-heading">

              <span className="page-eyebrow">
                WELCOME BACK
              </span>

              <h2>
                Sign in
              </h2>

              <p>
                Sign in to continue to
                your workspace.
              </p>

            </div>

            {error && (
              <div className="form-error login-error">
                {error}
              </div>
            )}

            <div className="form-group">

              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="Enter your username"
                autoComplete="username"
                disabled={loading}
              />

            </div>

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />

            </div>

            <button
              type="submit"
              className="primary-button login-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In →"}
            </button>

            <div className="login-signup">
              <span>
                Don't have an account?
              </span>

              <button
                type="button"
                onClick={onSignup}
                disabled={loading}
              >
                Create one
              </button>
            </div>

            <div className="login-footer">
              TaskFlow workspace
              <span>•</span>
              Secure sign in
            </div>

          </form>

        </div>

      </div>
    </main>
  );
}

export default Login;