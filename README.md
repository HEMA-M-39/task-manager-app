# Task Manager

A responsive full-stack task management web application for individual users to manage daily tasks with persistent SQLite storage.

## Features
- Create, read, update, delete, and complete tasks
- Filter and search tasks efficiently
- Persistent data storage via SQLite (survives application restarts)
- Unified Express server serving both the REST API and the React frontend static production build on port 8100

## Prerequisites
- Node.js (v18+ recommended)
- npm

## Quick Start & Installation

Install dependencies for the root monorepo (which automatically installs dependencies for both backend and frontend workspaces):

```bash
npm install
```

## Running the Application

### 1. Unified Production Server (Recommended)
Build both backend and frontend, then start the unified Express server which serves the frontend static build and API on port `8100`:

```bash
npm run build
npm start --workspace=backend
```
Once running, open your browser at:
`http://localhost:8100`

### 2. Development Mode
To run the backend in development mode with live reload:
```bash
npm run dev --workspace=backend
```
To run the frontend development server:
```bash
npm run dev --workspace=frontend
```

## Running Tests
To run backend unit and integration tests (using Vitest and Supertest):
```bash
npm test
```
