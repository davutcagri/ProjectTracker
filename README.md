# ProjectTracker

ProjectTracker is a small application I built to keep track of my local development projects in one place.

It reads project information and shows things like current progress, scope and roadmap status through a simple interface.

The backend is built with Java and Spring Boot. The frontend uses React and TypeScript.

I mainly built this project because I wanted a simple way to see the status of multiple projects without opening each repository separately.

## Running

Start the backend:

```bash id="a7k3mz"
cd backend
./mvnw spring-boot:run
```

Then start the frontend:

```bash id="pj4v8d"
cd frontend
npm install
npm run dev
```

The project is still in development and I plan to improve the way project information is collected and displayed.
