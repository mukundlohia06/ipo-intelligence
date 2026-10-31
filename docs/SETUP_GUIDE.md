# SETUP GUIDE — IPO Intelligence

This guide describes the intended local setup. Exact commands may need small adjustments to match the generated repository structure and the package versions selected by the team.

## 1. Prerequisites

Install:
- Node.js LTS
- Python 3.11 or later
- Git
- Visual Studio Code or Antigravity
- A MongoDB Atlas account

Optional:
- MongoDB Compass, a desktop GUI for connecting to MongoDB and inspecting databases and collections.

**Note:** MongoDB Compass is a client, not a database hosting service. Use MongoDB Atlas or a locally running MongoDB server as the database.

## 2. Frontend setup

After the Next.js frontend has been created, open a terminal in its directory and run:

```bash
npm install
npm run dev
```

The local frontend is normally available at:

http://localhost:3000

## 3. Backend setup

Open a terminal in the FastAPI backend directory.

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies (once `requirements.txt` exists):

```bash
pip install -r requirements.txt
```

Start the API (adjust the import path if the generated project uses a different layout):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend should be available at:

- API base: http://localhost:8000
- Interactive API documentation: http://localhost:8000/docs

## 4. Environment configuration

1. Keep this `.env.example` in the repository as a list of required variable names.
2. Create the actual environment file expected by the backend (commonly `backend/.env`).
3. Copy the relevant variables from `.env.example`.
4. Add the MongoDB Atlas URI and selected AI-provider credentials locally.
5. Configure the frontend API URL for local development.
6. Ensure actual `.env` files are listed in `.gitignore`.

Never commit real credentials. Do not prefix backend-only secrets with `NEXT_PUBLIC_`; Next.js exposes variables with that prefix to browser-side code.

## 5. MongoDB Atlas setup

1. Create a MongoDB Atlas project and cluster.
2. Create a database user with only the permissions the application needs.
3. Configure network access for development and deployment.
4. Use the Atlas connection-string interface to obtain the URI.
5. Set `MONGODB_URI` in the backend environment.
6. Set `MONGODB_DB=ipo_intelligence` (or the database name agreed by the team).
7. Start the backend and verify that it can connect.

MongoDB Compass can connect using the same Atlas URI. Use it to inspect collections and documents.

Vector Search and Atlas Search indexes must be created with definitions that match the actual document schema and embedding dimensions. Do not assume an index is ready immediately after creation; check its status before relying on it.

## 6. Initial verification checklist

- [ ] Frontend starts without errors.
- [ ] Backend starts without errors.
- [ ] The health endpoint returns a successful response.
- [ ] Backend can connect to MongoDB.
- [ ] Frontend can reach the FastAPI backend.
- [ ] CORS allows only the intended frontend origins.
- [ ] No secrets are exposed in browser code or committed to Git.
- [ ] Uploaded PDFs are validated and errors are handled clearly.

## 7. Troubleshooting

### MongoDB connection failure
Check the URI, database username/password, network access rules, and whether special characters in credentials are URL-encoded.

### Frontend cannot reach backend
Check the API base URL, backend availability, and FastAPI CORS configuration.

### Python dependency errors
Confirm that the virtual environment is activated and that the required Python version is installed.

### AI provider errors
Check the selected provider, API key, model identifier, quota, and network connectivity. Keep provider calls behind backend-side interfaces.

### Vector search returns no results
Check that documents were successfully chunked and embedded, that query and document embeddings use the same model and dimensions, and that the Vector Search index is active and matches the stored field names.

## 8. Security and data integrity

- Do not commit `.env` files or credentials.
- Keep provider keys and database credentials on the backend.
- Validate file type and size before processing uploads.
- Handle malformed or scanned PDFs explicitly; OCR may be required for image-only documents.
- Treat uploaded document text as untrusted input, not as system instructions.
- Preserve document identifiers, page numbers, and chunk provenance.
- Do not present unverified figures or generated estimates as official facts.
