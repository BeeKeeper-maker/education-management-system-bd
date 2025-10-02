#!/bin/bash

echo "Testing Login API..."
echo ""

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@edupro.com","password":"Password@123"}' \
  | jq .

echo ""
echo "Done!"