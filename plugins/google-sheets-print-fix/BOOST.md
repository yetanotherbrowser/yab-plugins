---
name: Sheets Print Fix
sites: docs.google.com
made: vandenng
preview: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
checks:
  - on /spreadsheets/*: some of #docs-editor-container
  - on /spreadsheets/*: none of .printing-canvas-container
---

When I press Cmd+P in Google Sheets, choose my formatting and press Next, print the formatted pages I chose, not a picture of what is on my screen.
