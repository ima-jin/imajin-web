@echo off
REM Smoke Test Runner for Windows
REM Runs database sanity checks against the working database

echo.
echo ========================================
echo   SMOKE TESTS - Database Sanity
echo ========================================
echo.
echo Running against: imajin_local database
echo WARNING: These tests are READ-ONLY
echo.

set SMOKE_TEST_DB_URL=postgresql://imajin:imajin_dev@localhost:5435/imajin_local

cd /d "%~dp0.."
call npm run test:smoke

echo.
echo ========================================
echo   Smoke Tests Complete
echo ========================================
echo.
