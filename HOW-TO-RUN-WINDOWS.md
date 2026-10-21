# Running CatalogX on Windows (VS Code + PowerShell)

## 0. One-time prerequisites
- **Node.js 18+**: check with `node -v`
- **MongoDB**: your `backend\.env` points at a **local** MongoDB (`mongodb://localhost...`),
  so the MongoDB service has to be running. Check with:
  ```powershell
  Get-Service MongoDB
  ```
  If it says `Stopped`, open PowerShell **as Administrator** and run `net start MongoDB`
  (or open *Services* → **MongoDB Server** → Start).
  If you don't have MongoDB installed, install "MongoDB Community Server", or use a free
  MongoDB Atlas cluster and paste its connection string into `MONGO_URI`.

## 1. Open the project
VS Code → *File → Open Folder* → pick the `Libray_MERN` folder.
Open a terminal with **Ctrl + `** (it's PowerShell by default).

## 2. Install packages (first time only, or after pulling changes)
```powershell
cd backend
npm install
cd ..\frontend
npm install
cd ..
```

## 3. Start it — option A: one command
```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```
This opens two PowerShell windows (backend + frontend).

## 3. Start it — option B: two VS Code terminals
Terminal 1 (click **+** in the terminal panel):
```powershell
cd backend
npm run dev        # auto-restarts on save. (npm start = no auto-restart)
```
You should see `✅ MongoDB Connected` and `🚀 Server running on http://localhost:5000`.

Terminal 2:
```powershell
cd frontend
npm start
```
The browser opens at **http://localhost:3000**.

## 4. First admin account
Only an admin can create staff, so make the first admin from the backend folder:
```powershell
cd backend
npm run seed:admin -- "Your Name" you@example.com YourPassword123
```
Then log in at http://localhost:3000/login. Create librarians from **Create Staff**.

## Common problems
| Symptom | Fix |
|---|---|
| `❌ MongoDB connection failed` | MongoDB service not running → `net start MongoDB` (admin PowerShell) |
| `Missing required env vars` | `backend\.env` missing → `copy .env.example .env` and fill it in |
| `npm : ... running scripts is disabled on this system` | Run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `Port 3000 is already in use` | Answer **Y** to use another port, or close the old terminal |
| `EADDRINUSE :::5000` | Old backend still running: `Get-Process node \| Stop-Process` |
| Login page says "Can't reach the server" | Backend terminal isn't running / crashed — check terminal 1 |
| Signup says it couldn't send the email | `EMAIL_PASS` must be a Gmail **App Password**, not your normal password |
| AI summary fails | Check `GEMINI_API_KEY`; run `npm run models` in `backend` to list valid model names and set `GEMINI_MODEL` |

Stop either server with **Ctrl + C** in its terminal.
