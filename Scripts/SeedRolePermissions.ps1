# ============================================
# Production Management - Seed Role Permissions Script
# ============================================
# This script seeds the default permissions for all roles in the system
# Run this script when you need to reset/seed role permissions
# 
# Prerequisites:
# - API must be running on http://localhost:5000
# - Admin user must exist (default: admin/admin123)
#
# Usage:
#   .\SeedRolePermissions.ps1
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Management - Seed Role Permissions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiBaseUrl = "http://localhost:5000/api"
$adminUsername = "admin"
$adminPassword = "admin123"

try {
    # Step 1: Login as admin
    Write-Host "[1/2] Logging in as admin..." -ForegroundColor Yellow
    $loginBody = @{
        username = $adminUsername
        password = $adminPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$apiBaseUrl/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    $token = $loginResponse.token
    Write-Host "  ✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0,20))..." -ForegroundColor Gray
    Write-Host ""

    # Step 2: Seed role permissions
    Write-Host "[2/2] Seeding role permissions..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $seedResponse = Invoke-RestMethod -Uri "$apiBaseUrl/rolepermission/seed" `
        -Method Post `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "  ✓ $($seedResponse.message)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Seeding completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The following roles have been seeded with permissions:" -ForegroundColor White
    Write-Host "  • ADMIN - All permissions (full system access)" -ForegroundColor White
    Write-Host "  • COORDONATOR VANZARI - Most permissions (except user/role management)" -ForegroundColor White
    Write-Host "  • AGENT TEREN - Basic view-only permissions" -ForegroundColor White
    Write-Host "  • ACHIZITIONER - Production, Inventory, Orders and Acquisitions" -ForegroundColor White
    Write-Host "  • MAGAZIONER - Inventory and Acquisitions only" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Seeding failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure the API is running on $apiBaseUrl" -ForegroundColor White
    Write-Host "  2. Verify admin credentials (username: $adminUsername)" -ForegroundColor White
    Write-Host "  3. Check the API logs for more details" -ForegroundColor White
    Write-Host ""
    exit 1
}

