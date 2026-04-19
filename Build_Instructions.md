# Litter Tracker

An app to track cat litter types and usage, as well as litter tray change dates

## Architecture

- Python 3
- Web-based, with API backend
- Automatic persistence of data as soon as a change has been made
- Persistence of data between runs of the app
- App should save all Python requirements to requirements.txt
- App should use Python virtual env
- App should have a run script that starts the app using the virtual env, but without running the venv's activate script
- App should have a powershell setup script that installs all requirements
- App should have a linux setup script that installs all requirements
- App should have a linux run script that starts the app using the virtual env, but without running the venv's activate script

## Features

- Add and remove liter trays
  - Each litter tray should have a desscription
  - Each litter tray should have a last scooped date
  - Each litter tray should have a last changed date
  - Each litter tray should have a litter type decsription field
  - each litter tray should have a notes field
- App should be responsive and work well on laptops or mobile phones
- App should highlight any litter tray wit a warning if the last scooped date is over a week ago
- When a tray's last changed date is updated, last scooped date should be updated to match
- Don't show tray number - simply show tray description as the tray titel
- Trays in the list should initially be shown in a collapsed state that has only the description and last scooped date
    - Once a tray is clicked or tapped on, expand to show the full detail
    - Only one tray at a time should be expanded
- Provide an optional facility to update the last scooped date for all trays at once