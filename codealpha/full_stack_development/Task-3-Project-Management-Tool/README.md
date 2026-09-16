# TaskFlow - Project Management Tool

TaskFlow is a full-stack project management application built using React and Django REST Framework.

The application allows users to create and manage projects, create and assign tasks, update task status and priority, communicate through comments, and view notifications.

TaskFlow also includes JWT authentication and WebSocket-based real-time functionality.

---

## Live Application

### Frontend

https://taskflow-frontend-32ih.onrender.com

### Backend

https://taskflow-backend-jh9o.onrender.com

The backend is an API service.

Opening the backend root URL:

https://taskflow-backend-jh9o.onrender.com/

may return:

404 Not Found

This is expected because the backend does not define a homepage at `/`.

The backend API is available through the `/api/` routes.

---

# Features

## Authentication

TaskFlow uses JWT authentication.

Users can:

- Register a new account
- Log in
- Receive an access token
- Receive a refresh token
- Access protected API endpoints
- Log out
- Maintain an authenticated session

The application uses Django's authentication system for user management.

---

# Dashboard

After logging in, users are taken to the main dashboard.

The dashboard provides access to:

- Projects
- Tasks
- Notifications
- User information
- Task information
- Project information

The dashboard acts as the main entry point to the application.

---

# Projects

Users can create and manage projects.

A project can contain multiple tasks.

Project functionality includes:

- View projects
- Create projects
- Update projects
- Open project details
- View tasks associated with a project

---

# Tasks

Tasks are the main work items in TaskFlow.

Users can:

- Create tasks
- View tasks
- Update tasks
- Delete tasks
- Assign tasks
- Set task priority
- Set task status
- Associate tasks with projects
- Filter tasks
- View task details

Typical task statuses include:

- Todo
- In Progress
- Completed

Task priority can be used to distinguish important work from normal work.

---

# Comments

Users can add comments to individual tasks.

Comments can be used for:

- Discussing task requirements
- Providing updates
- Communicating with team members
- Recording additional information

Each comment is associated with a task.

---

# Notifications

TaskFlow includes a notification system for user-related activity.

Users can:

- View notifications
- Receive notification updates
- Clear all notifications

The application also contains WebSocket support for real-time notification delivery.

---

# Real-Time WebSockets

TaskFlow uses Django Channels for WebSocket functionality.

There are two WebSocket endpoints:

/ws/tasks/

/ws/notifications/

WebSocket connections use JWT authentication.

The local development version supports real-time task and notification updates.

The deployed version currently has a Redis channel-layer timeout issue affecting some notification WebSocket connections.

The core REST API functionality remains available in the deployed application.

---

# Technology Stack

## Frontend

- React
- Vite
- JavaScript
- CSS
- Fetch API
- WebSocket API

## Backend

- Python
- Django
- Django REST Framework
- Django Channels
- Daphne
- Simple JWT

## Database

- SQLite

## Real-Time Communication

- WebSockets
- Django Channels
- Redis
- channels_redis

## Deployment

- Render

## Version Control

- Git
- GitHub

---

# Project Structure

```text
Task-3-Project-Management-Tool/
│
├── backend/
│   ├── accounts/
│   ├── comments/
│   ├── config/
│   ├── notifications/
│   ├── projects/
│   ├── tasks/
│   │
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3
│   └── staticfiles/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── Comments.jsx
│   │   ├── Dashboard.jsx
│   │   ├── index.css
│   │   ├── Login.jsx
│   │   ├── main.jsx
│   │   ├── Notifications.jsx
│   │   ├── ProjectDetails.jsx
│   │   ├── ProjectForm.jsx
│   │   ├── Projects.jsx
│   │   ├── Signup.jsx
│   │   ├── TaskForm.jsx
│   │   ├── Tasks.jsx
│   │   ├── useNotificationsSocket.js
│   │   └── useTasksSocket.js
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

# Running TaskFlow Locally

The complete application can be run locally by running the backend and frontend separately.

## Requirements

Install the following before starting:

- Python 3.11 or newer
- Node.js
- npm
- Git

---

# 1. Clone the Repository

Clone the repository:

git clone https://github.com/Manish1115/intership-projects.git

Move into the TaskFlow project:

cd intership-projects\codealpha\full_stack_development\Task-3-Project-Management-Tool

---

# 2. Backend Setup

Open a terminal and enter the backend directory:

cd backend

---

# 3. Create a Python Virtual Environment

Run:

python -m venv venv

Activate the virtual environment:

.\venv\Scripts\Activate.ps1

If PowerShell blocks script execution, run:

Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned

Then activate the environment again:

.\venv\Scripts\Activate.ps1

You should see `(venv)` in the terminal.

---

# 4. Install Backend Dependencies

Run:

pip install -r requirements.txt

This installs the required Django, Django REST Framework, Channels, Daphne, Redis and authentication dependencies.

---

# 5. Run Database Migrations

Run:

python manage.py migrate

This creates the required SQLite database tables.

---

# 6. Check Django

Run:

python manage.py check

A successful result should look similar to:

System check identified no issues (0 silenced).

---

# 7. Collect Static Files

Run:

python manage.py collectstatic --noinput

The collected files will be placed inside:

staticfiles/

---

# 8. Start the Backend

For normal Django development:

python manage.py runserver

The backend will normally run at:

http://127.0.0.1:8000/

The root URL may display:

404 Not Found

This is expected because the application exposes API endpoints rather than a homepage at `/`.

---

# 9. Start the Backend with WebSocket Support

For testing the complete application including WebSockets, use Daphne:

daphne config.asgi:application

The backend will normally listen on:

127.0.0.1:8000

Do not run two servers on the same port simultaneously.

If you see:

WinError 10048

another process is already using port 8000.

Stop the existing server and start Daphne again.

---

# 10. Frontend Setup

Open a second terminal.

Move to the frontend directory:

cd frontend

Install dependencies:

npm install

---

# 11. Configure the Frontend API URL

The frontend supports the following environment variable:

VITE_API_BASE_URL

For local development, the application defaults to:

http://127.0.0.1:8000/api

If required, create a `.env` file inside the frontend directory:

VITE_API_BASE_URL=http://127.0.0.1:8000/api

---

# 12. Start the Frontend

Run:

npm run dev

Vite will display the local frontend URL.

Usually it will be:

http://localhost:5173

Open the URL shown by Vite in your browser.

---

# Running the Complete Application Locally

You should have two terminals.

## Terminal 1 - Backend

cd backend

.\venv\Scripts\Activate.ps1

daphne config.asgi:application

## Terminal 2 - Frontend

cd frontend

npm run dev

Then open the frontend URL displayed by Vite.

---

# How to Use TaskFlow

## 1. Create an Account

Open the TaskFlow frontend.

On the login page, select the signup/register option.

Enter the required information.

Submit the registration form.

After successfully registering, log in using the newly created credentials.

---

# 2. Log In

Enter:

- Username
- Password

After successful authentication, TaskFlow receives JWT tokens.

The frontend stores the authentication tokens in browser local storage.

The user is then taken to the application dashboard.

---

# 3. Use the Dashboard

The dashboard provides access to the main application features.

From the dashboard, users can navigate to:

- Projects
- Tasks
- Notifications

---

# 4. Create a Project

Open the Projects section.

Choose the create project option.

Enter the project information.

Submit the form.

The project will appear in the project list.

---

# 5. Open a Project

Select a project from the project list.

The project details page provides information about the project and its associated tasks.

---

# 6. Create a Task

Open the Tasks section or create a task from a project.

Enter the required task information.

Typical information includes:

- Title
- Description
- Project
- Assignee
- Priority
- Status
- Due Date

Submit the form.

The task is sent to the Django REST API and stored in the database.

---

# 7. Update a Task

Open an existing task.

Modify the required information.

For example:

- Status
- Priority
- Assignee
- Description

Save the changes.

The frontend sends an update request to the backend.

---

# 8. Delete a Task

Open an existing task.

Choose the delete option.

The frontend sends a DELETE request to the backend.

The task is removed from the database.

---

# 9. Add Comments

Open a task.

Navigate to the comments section.

Write a comment.

Submit the comment.

The comment is associated with that task.

---

# 10. View Notifications

Open the Notifications section.

Notifications related to the authenticated user can be viewed there.

Users can also clear all notifications.

---

# 11. Real-Time Updates

When running locally with the ASGI server and Channels configured correctly, TaskFlow establishes WebSocket connections.

Task WebSocket:

ws://127.0.0.1:8000/ws/tasks/

Notification WebSocket:

ws://127.0.0.1:8000/ws/notifications/

The JWT access token is included when establishing the connection.

---

# Authentication

TaskFlow uses JSON Web Tokens for API authentication.

The frontend stores:

- access_token
- refresh_token

in browser local storage.

Authenticated API requests include:

Authorization: Bearer <access_token>

If the backend returns HTTP 401, the frontend removes the stored tokens and treats the session as expired.

The user can then log in again.

---

# API Endpoints

All API endpoints are available under:

/api/

---

## Authentication

POST /api/auth/login/

POST /api/auth/refresh/

GET /api/auth/me/

---

## Accounts

POST /api/accounts/register/

GET /api/accounts/users/

---

## Projects

GET /api/projects/

POST /api/projects/

PATCH /api/projects/<project_id>/

---

## Tasks

GET /api/tasks/

POST /api/tasks/

PATCH /api/tasks/<task_id>/

DELETE /api/tasks/<task_id>/

---

## Comments

GET /api/comments/?task=<task_id>

---

## Notifications

GET /api/notifications/

DELETE /api/notifications/clear-all/

---

# Example API Requests

## Login

POST /api/auth/login/

Example request body:

{
    "username": "your_username",
    "password": "your_password"
}

The backend returns JWT authentication tokens.

---

# Get Current User

GET /api/auth/me/

Authentication:

Authorization: Bearer <access_token>

---

# Get Tasks

GET /api/tasks/

Authentication is required.

---

# Create a Task

POST /api/tasks/

Authentication is required.

---

# Update a Task

PATCH /api/tasks/<task_id>/

Authentication is required.

---

# Delete a Task

DELETE /api/tasks/<task_id>/

Authentication is required.

---

# Get Projects

GET /api/projects/

---

# Create a Project

POST /api/projects/

---

# Update a Project

PATCH /api/projects/<project_id>/

---

# Get Comments

GET /api/comments/?task=<task_id>

---

# Get Notifications

GET /api/notifications/

---

# Clear Notifications

DELETE /api/notifications/clear-all/

---

# Environment Variables

## Backend

The backend supports the following environment variables.

### DJANGO_SECRET_KEY

Django secret key.

Example:

DJANGO_SECRET_KEY=your-secure-secret-key

A production deployment should use a secure environment variable rather than storing secrets in source code.

---

### DJANGO_DEBUG

Controls Django debug mode.

Local development:

DJANGO_DEBUG=True

Production:

DJANGO_DEBUG=False

---

### DJANGO_ALLOWED_HOSTS

Comma-separated list of allowed hosts.

Example:

DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

For production, the deployed backend hostname should be included.

---

### CORS_ALLOWED_ORIGINS

Comma-separated list of allowed frontend origins.

Example:

CORS_ALLOWED_ORIGINS=http://localhost:5173

---

### REDIS_URL

Redis connection URL used by Django Channels.

Example:

REDIS_URL=redis://...

When `REDIS_URL` is available, Django Channels uses Redis through `channels_redis`.

For local development without Redis, the project can use the in-memory channel layer.

---

# CORS

The backend is configured to allow common local Vite development origins.

Examples include:

http://localhost:5173

http://127.0.0.1:5173

Additional origins can be configured using:

CORS_ALLOWED_ORIGINS

---

# Production Deployment

TaskFlow is deployed using Render.

The deployment consists of:

- Frontend
- Backend
- Redis / Key Value

---

# Backend Deployment

The backend is deployed as an ASGI web service.

The production server uses Daphne.

Render start command:

daphne -b 0.0.0.0 -p $PORT config.asgi:application

The `$PORT` variable is supplied by Render.

---

# Frontend Deployment

The frontend is a Vite application.

The production build command is:

npm install && npm run build

The production files are generated inside:

dist/

The production API URL is configured using:

VITE_API_BASE_URL

Example:

VITE_API_BASE_URL=https://taskflow-backend-jh9o.onrender.com/api

---

# Production Backend

The deployed backend is available at:

https://taskflow-backend-jh9o.onrender.com

The backend root URL returning 404 is expected.

Example API routes include:

https://taskflow-backend-jh9o.onrender.com/api/auth/

https://taskflow-backend-jh9o.onrender.com/api/tasks/

https://taskflow-backend-jh9o.onrender.com/api/projects/

https://taskflow-backend-jh9o.onrender.com/api/notifications/

---

# Production WebSockets

The frontend automatically chooses the correct WebSocket protocol.

For local HTTP:

ws://

For HTTPS:

wss://

The deployed backend uses Daphne and Django Channels for WebSocket support.

The local environment is the verified environment for complete real-time WebSocket functionality.

The deployed environment currently has a Redis channel-layer timeout affecting some notification WebSocket connections.

This does not prevent the core REST API from functioning.

---

# Static Files

Django static files can be collected using:

python manage.py collectstatic --noinput

The generated static files are placed inside:

staticfiles/

---

# Security

For production deployment, configure:

DJANGO_DEBUG=False

DJANGO_SECRET_KEY=<strong-secret-key>

DJANGO_ALLOWED_HOSTS=<backend-domain>

CORS_ALLOWED_ORIGINS=<frontend-domain>

Never commit:

- Passwords
- Secret keys
- JWT tokens
- Redis credentials
- API keys
- `.env` files containing secrets

to GitHub.

---

# Troubleshooting

## Backend returns 404 at `/`

If:

https://taskflow-backend-jh9o.onrender.com/

returns:

404 Not Found

this is expected.

The Django project does not define a route for `/`.

Use the API endpoints instead.

---

# `/api/` Returns 404

The project does not define a generic `/api/` route.

Use specific endpoints such as:

/api/auth/login/

/api/auth/me/

/api/tasks/

/api/projects/

/api/comments/

/api/notifications/

---

# Port 8000 Already in Use

If you see:

WinError 10048

another process is already using port 8000.

Stop the running Django/Daphne process before starting another one.

---

# SECRET_KEY Error

If Django reports:

django.core.exceptions.ImproperlyConfigured:
The SECRET_KEY setting must not be empty.

check the SECRET_KEY configuration in:

backend/config/settings.py

For production, configure:

DJANGO_SECRET_KEY=<secure-secret-key>

---

# Frontend Cannot Connect to Backend

Check the API environment variable:

VITE_API_BASE_URL

Local:

http://127.0.0.1:8000/api

Production:

https://taskflow-backend-jh9o.onrender.com/api

Also check:

- Browser console
- Network tab
- Backend logs
- CORS configuration

---

# WebSocket Does Not Connect Locally

Make sure the backend is running with Daphne:

daphne config.asgi:application

Make sure a valid JWT access token exists.

Then open the browser developer console and check for:

Task WebSocket connected.

and:

Notification WebSocket connected.

---

# Redis WebSocket Timeout

A production Redis error may look like:

redis.exceptions.TimeoutError:
Timeout reading from red-xxxxxxxx:6379

This indicates a Redis/channel-layer connection problem.

Redis is used for the Channels messaging layer.

It is not the application's primary database.

Therefore, a Redis channel-layer failure does not mean that users, projects or tasks stored in SQLite have been deleted.

The REST API can continue functioning while the Redis/WebSocket infrastructure is investigated.

---

# Development Workflow

A typical development workflow is:

1. Start the backend
2. Start the frontend
3. Create or log in to an account
4. Create a project
5. Create tasks
6. Assign tasks
7. Update task status
8. Update task priority
9. Add comments
10. Test notifications
11. Test WebSockets locally
12. Run Django checks
13. Build the frontend
14. Commit changes
15. Push to GitHub
16. Deploy
17. Test the deployed application

---

# Useful Backend Commands

Check Django configuration:

python manage.py check

Run migrations:

python manage.py migrate

Create migrations:

python manage.py makemigrations

Collect static files:

python manage.py collectstatic --noinput

Run Django development server:

python manage.py runserver

Run Daphne:

daphne config.asgi:application

---

# Useful Frontend Commands

Install dependencies:

npm install

Start development server:

npm run dev

Create production build:

npm run build

---

# Git Commands

Check repository status:

git status

Stage changes:

git add .

Commit:

git commit -m "Update TaskFlow documentation"

Push:

git push origin main

---

# Browser Storage

TaskFlow uses browser local storage for authentication.

The application stores:

access_token

refresh_token

If authentication becomes invalid during development, log out and log in again.

For a completely fresh session, the stored authentication data can be cleared from the browser's developer tools.

---

# Database

The local development database uses SQLite.

The database file is:

db.sqlite3

It stores application data such as:

- Users
- Projects
- Tasks
- Comments
- Notifications

For a larger production system, a database such as PostgreSQL would be more appropriate.

---

# Application Architecture

TaskFlow follows a client-server architecture.

                    ┌─────────────────────┐
                    │      React UI       │
                    │       Vite          │
                    └──────────┬──────────┘
                               │
                       REST API / WebSocket
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Django / DRF        │
                    │ Authentication      │
                    │ Business Logic      │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐       ┌─────────────────┐
        │ SQLite Database │       │ Django Channels │
        └─────────────────┘       └────────┬────────┘
                                           │
                                           ▼
                                      ┌──────────┐
                                      │  Redis   │
                                      └──────────┘

---

# Authentication Flow

User
  |
  v
Login Page
  |
  v
POST /api/auth/login/
  |
  v
Django REST Framework
  |
  v
JWT Access + Refresh Tokens
  |
  v
Browser localStorage
  |
  v
Authenticated API Requests

---

# Task Update Flow

User changes a task
        |
        v
React frontend
        |
        v
PATCH /api/tasks/<id>/
        |
        v
Django REST API
        |
        v
Database
        |
        v
Task update
        |
        v
Django Channels
        |
        v
WebSocket clients

---

# Project Goals

The main goals of TaskFlow are:

- Build a practical project management application
- Build a modern React frontend
- Build a REST API using Django REST Framework
- Implement JWT authentication
- Implement project management
- Implement task management
- Implement task assignment
- Implement comments
- Implement notifications
- Implement WebSocket-based real-time communication
- Practice full-stack development
- Deploy the application to the cloud

---

# Current Status

## Completed

- [x] React frontend
- [x] Django backend
- [x] Django REST Framework
- [x] JWT authentication
- [x] User registration
- [x] Login
- [x] Project management
- [x] Task management
- [x] Task assignment
- [x] Task status
- [x] Task priority
- [x] Comments
- [x] Notifications
- [x] REST API
- [x] WebSocket implementation
- [x] Local WebSocket functionality
- [x] Static file collection
- [x] Production frontend build
- [x] Render backend deployment
- [x] Render frontend deployment
- [x] Redis integration for Django Channels

---

# Known Deployment Limitation

The deployed application currently experiences Redis channel-layer timeout errors for some notification WebSocket connections.

The complete real-time WebSocket functionality is verified in the local development environment.

The deployed REST API and core application functionality remain available.

This is an infrastructure/deployment limitation rather than a missing application feature.

---

# Future Improvements

Potential future improvements include:

- Fixing production Redis/WebSocket reliability
- Migrating production database from SQLite to PostgreSQL
- Improved notification delivery
- Better WebSocket reconnection handling
- Email notifications
- File attachments
- Advanced task filtering
- Search functionality
- User roles and permissions
- Team management
- Project analytics
- Task deadlines and reminders
- Automated testing
- CI/CD pipeline
- Production monitoring
- Rate limiting
- Additional security hardening

---

# Author

Manish Bagul

## Project

TaskFlow - Project Management Tool

Developed as part of the CodeAlpha Full Stack Development internship/project work.

---

# License

This project was created for educational and internship purposes.
