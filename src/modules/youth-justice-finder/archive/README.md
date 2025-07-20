# Archive Directory

This directory contains experimental scripts and data files that were moved during codebase cleanup on 2025-07-19.

## experimental-scripts/
Contains various experimental and debugging scripts that were used during development:
- Data import scripts (import-*, railway-import-*)
- Scraping experiments (scrape-*, expand-scrapers.js)
- Debug utilities (debug-*, manual-test.js)
- Data processing scripts (merge-*, focused-*, maximum-*, mega-*)
- Quick setup/testing scripts

## data-extracts/
Contains large JSON data files and logs from scraping operations:
- Service extraction results (extracted-services-*, *extraction*.json)
- Scraping reports and logs (*.log, *scraping*.json)
- Queensland services data (queensland-youth-services.json)
- Other service data collections (expanded-services.json, mass-*.json)

## Purpose
These files were moved to clean up the root directory and improve project organization. They are preserved for reference but are not part of the core application.

## Current Status
The main application now uses:
- `/src/api/server-simple.js` as the primary server
- `/src/api/routes/diagnostic-search.js` as the main search endpoint
- Centralized error handling in `/src/utils/error-handler.js`
- Database performance optimizations in `/database/migrations/004_optimize_search_performance.sql`