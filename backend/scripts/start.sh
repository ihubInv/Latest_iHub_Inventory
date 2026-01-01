#!/bin/bash

# IHub Inventory Backend Startup Script

echo "🚀 Starting IHub Inventory Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   You can download it from: https://www.mongodb.com/try/download/community"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f config.env.example ]; then
        cp config.env.example .env
        echo "✅ .env file created from template."
        echo "📝 Please update the .env file with your configuration."
    else
        echo "❌ config.env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
    echo "✅ Dependencies installed successfully."
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p uploads/profile-pictures
    mkdir -p uploads/inventory-attachments
    mkdir -p uploads/category-images
    mkdir -p uploads/asset-images
    mkdir -p uploads/general
    echo "✅ Uploads directory created."
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   On Ubuntu/Debian: sudo systemctl start mongod"
    echo "   On macOS: brew services start mongodb-community"
    echo "   On Windows: net start MongoDB"
    exit 1
fi

# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ihub_inventory')
  .then(() => {
    console.log('✅ MongoDB connection successful');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo "❌ MongoDB connection test failed."
    exit 1
fi

# Seed database if requested
if [ "$1" = "--seed" ]; then
    echo "🌱 Seeding database..."
    npm run seed
    if [ $? -ne 0 ]; then
        echo "❌ Database seeding failed."
        exit 1
    fi
    echo "✅ Database seeded successfully."
fi

# Start the server
echo "🚀 Starting the server..."
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Running in production mode..."
    npm start
else
    echo "🔧 Running in development mode..."
    npm run dev
fi
