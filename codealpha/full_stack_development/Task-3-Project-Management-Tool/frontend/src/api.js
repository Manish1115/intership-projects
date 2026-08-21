const API_BASE_URL =
  "http://127.0.0.1:8000/api";

export async function apiRequest(
  endpoint,
  options = {}
) {
  const token =
    localStorage.getItem("access_token");

  const headers = {
    ...(options.body
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    throw new Error(
      "SESSION_EXPIRED"
    );
  }

  const data =
    await response.json().catch(
      () => null
    );

  if (!response.ok) {
    console.error(
      "API ERROR:",
      {
        endpoint,
        status: response.status,
        data,
      }
    );

    let message =
      data?.detail ||
      data?.message ||
      "Something went wrong";

    if (
      typeof data === "object" &&
      data !== null
    ) {
      const fieldErrors = Object.entries(
        data
      )
        .filter(
          ([key]) =>
            Array.isArray(data[key])
        )
        .map(
          ([key, messages]) =>
            `${key}: ${messages.join(", ")}`
        );

      if (fieldErrors.length > 0) {
        message =
          fieldErrors.join(" | ");
      }
    }

    const error = new Error(message);

    error.status =
      response.status;

    error.data = data;

    throw error;
  }

  return data;
}

export function registerUser(
  userData
) {
  return apiRequest(
    "/accounts/register/",
    {
      method: "POST",
      body: JSON.stringify(
        userData
      ),
    }
  );
}

export function getTasks(
  params = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.append(key, value);
      }
    }
  );

  const queryString =
    query.toString();

  return apiRequest(
    `/tasks/${
      queryString
        ? `?${queryString}`
        : ""
    }`
  );
}

export function createTask(
  taskData
) {
  return apiRequest("/tasks/", {
    method: "POST",
    body: JSON.stringify(
      taskData
    ),
  });
}

export function updateTask(
  taskId,
  taskData
) {
  return apiRequest(
    `/tasks/${taskId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(
        taskData
      ),
    }
  );
}

export function deleteTask(
  taskId
) {
  return apiRequest(
    `/tasks/${taskId}/`,
    {
      method: "DELETE",
    }
  );
}

export function getProjects() {
  return apiRequest(
    "/projects/"
  );
}

export function createProject(
  projectData
) {
  return apiRequest(
    "/projects/",
    {
      method: "POST",
      body: JSON.stringify(
        projectData
      ),
    }
  );
}

export function updateProject(
  projectId,
  projectData
) {
  return apiRequest(
    `/projects/${projectId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(
        projectData
      ),
    }
  );
}

export function getUsers() {
  return apiRequest(
    "/accounts/users/"
  );
}

export function getMe() {
  return apiRequest(
    "/auth/me/"
  );
}

export function getNotifications() {
  return apiRequest(
    "/notifications/"
  );
}

export function getComments(
  taskId
) {
  return apiRequest(
    `/comments/?task=${taskId}`
  );
}

export function clearAllNotifications() {
  return apiRequest(
    "/notifications/clear-all/",
    {
      method: "DELETE",
    }
  );
}