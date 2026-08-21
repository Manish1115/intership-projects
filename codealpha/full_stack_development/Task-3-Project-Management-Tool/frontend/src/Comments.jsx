import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getComments,
  apiRequest,
} from "./api";

function Comments({ taskId }) {
  const [comments, setComments] =
    useState([]);

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Reference to the scrollable comments
   * container.
   */
  const commentsListRef =
    useRef(null);

  /*
   * Automatically scroll to the newest
   * comment whenever the comments array
   * changes.
   */
  useEffect(() => {
    const commentsList =
      commentsListRef.current;

    if (!commentsList) {
      return;
    }

    /*
     * requestAnimationFrame waits until
     * React has finished rendering the
     * newly-added comment.
     */
    requestAnimationFrame(() => {
      commentsList.scrollTop =
        commentsList.scrollHeight;
    });
  }, [comments]);

  const loadComments = async () => {
    setLoading(true);
    setError("");

    try {
      const data =
        await getComments(taskId);

      setComments(
        data.results || data || []
      );
    } catch (error) {
      console.error(error);

      if (
        error.message !==
        "SESSION_EXPIRED"
      ) {
        setError(
          "Unable to load comments."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      loadComments();
    }
  }, [taskId]);

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const trimmedContent =
      content.trim();

    if (!trimmedContent) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const newComment =
        await apiRequest(
          "/comments/",
          {
            method: "POST",

            body: JSON.stringify({
              task: taskId,
              content:
                trimmedContent,
            }),
          }
        );

      /*
       * Add the new comment to the
       * existing list.
       *
       * This changes `comments`,
       * which triggers the useEffect
       * above and automatically
       * scrolls to the bottom.
       */
      setComments(
        (current) => [
          ...current,
          newComment,
        ]
      );

      setContent("");
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
            "Unable to post comment."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <div>
          <h3>Comments</h3>

          <p>
            Discuss this task with your
            team.
          </p>
        </div>

        <span className="comment-count">
          {comments.length}
        </span>
      </div>

      {loading ? (
        <div className="comments-empty">
          <p>
            Loading comments...
          </p>
        </div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">
          <p>
            No comments yet.
          </p>
        </div>
      ) : (
        /*
         * This is the element that
         * actually scrolls.
         */
        <div
          className="comments-list"
          ref={commentsListRef}
        >
          {comments.map(
            (comment) => (
              <div
                className="comment"
                key={comment.id}
              >
                <div className="comment-avatar">
                  {(
                    comment.author
                      ?.username ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="comment-body">
                  <div className="comment-meta">
                    <strong>
                      {
                        comment
                          .author
                          ?.username ||
                        "Unknown user"
                      }
                    </strong>

                    <span>
                      {new Date(
                        comment.created_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  <p>
                    {comment.content}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <form
        className="comment-form"
        onSubmit={handleSubmit}
      >
        <textarea
  value={content}
  onChange={(event) =>
    setContent(event.target.value)
  }
  onKeyDown={(event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        !submitting &&
        content.trim()
      ) {
        event.currentTarget.form.requestSubmit();
      }
    }
  }}
  placeholder="Write a comment..."
  rows="3"
  disabled={submitting}
/>

        <button
          type="submit"
          className="primary-button"
          disabled={
            submitting ||
            !content.trim()
          }
        >
          {submitting
            ? "Posting..."
            : "Post Comment"}
        </button>
      </form>
    </div>
  );
}

export default Comments;