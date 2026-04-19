# Litter Tracker

Litter Tracker is a small Python web app for tracking cat litter trays, scoop dates, change dates, litter type, and notes.

## Features

- Add and remove litter trays
- Track for each tray:
  - Description
  - Last scooped date
  - Last changed date
  - Litter type description
  - Notes
- Auto-save tray edits through the API
- Persistent storage using SQLite (`litter_tracker.db`)
- Warning highlight when a tray's last scooped date is more than 7 days ago
- If last changed date is updated, last scooped date is automatically updated to match
- Responsive UI for laptop and mobile

## Requirements

- Python 3

## Project Files

- `app.py` - Flask app and API backend
- `requirements.txt` - Python dependencies
- `setup.ps1` - Windows setup script (creates venv, installs requirements)
- `run.ps1` - Windows run script (runs app via venv Python, no activate script)
- `setup.sh` - Linux setup script (creates venv, installs requirements)
- `run.sh` - Linux run script (runs app via venv Python, no activate script)

## Windows Setup and Run (PowerShell)

1. Run setup:

   ```powershell
   .\setup.ps1
   ```

2. Run app:

   ```powershell
   .\run.ps1
   ```

3. Open:
   - [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Linux Setup and Run

1. Make scripts executable (first time only):

   ```bash
   chmod +x setup.sh run.sh
   ```

2. Run setup:

   ```bash
   ./setup.sh
   ```

3. Run app:

   ```bash
   ./run.sh
   ```

4. Open:
   - [http://127.0.0.1:8000](http://127.0.0.1:8000)

## API Endpoints

- `GET /api/trays` - List trays
- `POST /api/trays` - Create tray
- `PUT /api/trays/<id>` - Update tray
- `DELETE /api/trays/<id>` - Delete tray

## Notes

- Data is stored locally in `litter_tracker.db`.
- This app uses Flask's development server by default.


