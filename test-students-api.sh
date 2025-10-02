#!/bin/bash

echo "Testing Students API..."
echo ""

# Login to get token
echo "1. Logging in as SuperAdmin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@edupro.com","password":"Password@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "Token obtained: ${TOKEN:0:20}..."
echo ""

# Get classes
echo "2. Fetching classes..."
curl -s -X GET "http://localhost:3000/api/academic/classes" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
echo ""

# Get all students
echo "3. Fetching all students..."
curl -s -X GET "http://localhost:3000/api/students?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.pagination'
echo ""

# Get student stats
echo "4. Fetching student statistics..."
curl -s -X GET "http://localhost:3000/api/students/stats" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "Done!"