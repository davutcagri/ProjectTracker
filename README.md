# ProjectTracker

A small application I built to track my local development projects in one place.

It reads each project's `README.md`, `SCOPE.md` and `ROADMAP.md` files and shows progress, scope and roadmap status through a simple interface — without having to open each repository separately.

The backend is Java + Spring Boot, the frontend is React + TypeScript.

## Claude integration

When a project is missing any of those markdown files, the app runs the locally installed `claude` CLI as a subprocess inside that project's directory. A custom agent called `portal-doc-generator` kicks in and asks a few questions about the project through the portal UI — things like "what does this project do?" or "what stack are you using?". Once I answer them, Claude resumes the session and generates the missing files. The agent's file access is restricted to `*.md` files in the project root so it can't touch anything else.

It requires `claude` CLI v2.1.236+ to be installed and logged in.

## Running

Start the backend:

    cd backend
    ./mvnw spring-boot:run

Then start the frontend:

    cd frontend
    npm install
    npm run dev

The project is still in development and I plan to improve how project information is collected and displayed.
