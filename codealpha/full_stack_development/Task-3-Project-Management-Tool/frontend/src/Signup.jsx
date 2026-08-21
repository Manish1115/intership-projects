import { useState } from "react";
import { apiRequest } from "./api";

function Signup({
  onSignup,
  onBackToLogin,
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedUsername =
      username.trim();

    setError("");

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedUsername) {
      setError(
        "Please enter a username."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      await apiRequest(
        "/accounts/register/",
        {
          method: "POST",
          body: JSON.stringify({
            first_name: trimmedName,
            username: trimmedUsername,
            password,
          }),
        }
      );

      onSignup();
    } catch (error) {
      console.error(
        "Signup error:",
        error
      );

      const data = error.data;

      if (data?.username) {
        setError(
          Array.isArray(data.username)
            ? data.username[0]
            : data.username
        );
      } else if (data?.first_name) {
        setError(
          Array.isArray(data.first_name)
            ? data.first_name[0]
            : data.first_name
        );
      } else if (data?.password) {
        setError(
          Array.isArray(data.password)
            ? data.password[0]
            : data.password
        );
      } else {
        setError(
          error.message ||
            "Unable to create account."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-page">
      <div className="signup-card">

        <div className="signup-header">

          <div className="signup-logo">
            <span className="signup-logo-mark">
              T
            </span>

            <span>
              TaskFlow
            </span>
          </div>

          <span className="signup-eyebrow">
            GET STARTED
          </span>

          <h1>
            Create your account
          </h1>

          <p>
            Start organizing your work
            with TaskFlow.
          </p>

        </div>

        {error && (
          <div className="signup-error">
            <span>!</span>
            {error}
          </div>
        )}

        <form
          className="signup-form-simple"
          onSubmit={handleSubmit}
        >

          <div className="signup-field">
            <label htmlFor="signup-name">
              Name
            </label>

            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Your name"
              autoComplete="name"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="signup-field">
            <label htmlFor="signup-username">
              Username
            </label>

            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              placeholder="Choose a username"
              autoComplete="username"
              disabled={loading}
            />

            <span className="signup-hint">
              Username must be unique.
            </span>
          </div>

          <div className="signup-field">
            <label htmlFor="signup-password">
              Password
            </label>

            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="At least 8 characters"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="primary-button signup-submit"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create account →"}
          </button>

        </form>

        <div className="signup-login">
          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={onBackToLogin}
            disabled={loading}
          >
            Sign in
          </button>
        </div>

        <div className="signup-footer">
          TaskFlow · Simple project management
        </div>

      </div>
    </main>
  );
}

export default Signup;