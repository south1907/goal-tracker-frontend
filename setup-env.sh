#!/bin/bash

# Create environment file for frontend
cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=Goal Tracker
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF

echo "✅ Environment file created: .env.local"
echo "📝 Please verify the API base URL matches your backend server"
