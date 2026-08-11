# Cloud-Based Bus Pass System

A web-based bus booking and ticket management system built with Flask and MySQL. The application supports user registration, authentication, bus search, seat booking, ticket generation, QR-based ticket verification, booking cancellation, and administrative management.

The application is deployed on Render and uses Aiven Cloud MySQL as the production database.

## Live Application

https://cloudbus-wy46.onrender.com/

## Features

- User registration and login
- Secure password handling
- Bus search by source and destination
- Real-time seat availability
- Multi-seat booking
- Server-side fare calculation
- Booking reference generation
- Digital ticket generation
- QR-code ticket verification
- Booking cancellation
- Cancelled-ticket validation
- Admin dashboard
- Cloud-hosted MySQL database
- SSL/TLS connection between application and database
- Production deployment using Gunicorn

## Technology Stack

### Backend
- Python
- Flask
- MySQL Connector/Python

### Frontend
- HTML5
- CSS3
- JavaScript

### Database
- MySQL
- Aiven Cloud

### Deployment
- Render
- Gunicorn

### Version Control
- Git
- GitHub

## System Architecture

```text
                    ┌─────────────────────┐
                    │       Users         │
                    │   Web Browser       │
                    └──────────┬──────────┘
                               │
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │       Render        │
                    │ Flask + Gunicorn    │
                    └──────────┬──────────┘
                               │
                               │ SSL/TLS
                               ▼
                    ┌─────────────────────┐
                    │       Aiven         │
                    │     MySQL Cloud     │
                    │                     │
                    │      cloudbus       │
                    └─────────────────────┘