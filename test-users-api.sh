#!/bin/bash

echo "Testing Users API..."
echo ""

# First login to get token
echo "1. Logging in as SuperAdmin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@edupro.com","password":"Password@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "Token obtained: ${TOKEN:0:20}..."
echo ""

# Get all users
echo "2. Fetching all users..."
curl -s -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Get user stats
echo "3. Fetching user statistics..."
curl -s -X GET "http://localhost:3000/api/users/stats" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "Done!"