# FAU Progress Report Midterm Tracking

A React dashboard for reviewing faculty progress report completion data from a committed CSV file.

This project is designed as a lightweight reporting tool for advising and student success operations. It reads progress report data from the repository, calculates completion metrics, and presents the results in a clean dashboard format.

## Current Features

- Reads progress report data from a committed CSV file
- Displays overall completion metrics
- Shows college-level completion rates
- Shows department-level completion rates
- Provides faculty-level reporting
- Includes filtering by college, department, and submission status
- Includes searchable and sortable faculty data
- Uses a frontend-only static data approach

## Data Source

The dashboard reads from:

```txt
public/data/progress_reports.csv
```

To update the dashboard data:

1. Replace the CSV file in `public/data/`
2. Keep the expected column structure
3. Commit and push the updated file
4. Rebuild or redeploy the app

## Tech Stack

- React
- Vite
- Tailwind CSS
- JavaScript
- CSV-based static reporting data

## Project Purpose

This project demonstrates how institutional reporting data can be transformed into a simple operational dashboard without requiring a database, upload interface, or backend system.

The goal is to support quick review of progress report completion patterns by faculty, department, and college.

## Planned Enhancements

- Add midterm grade outcome comparison
- Compare progress report risk indicators against later midterm performance
- Add trend reporting across terms
- Add exportable summaries
- Add clearer documentation for expected CSV columns

## Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Notes

This project is currently a frontend dashboard MVP. It uses static CSV data committed to the repository rather than an upload workflow.
