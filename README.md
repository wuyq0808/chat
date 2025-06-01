# Chat Application

A chat application built with Nx, React, and Vite.

## Prerequisites

Before you begin, ensure you have the following installed on your Mac:

### 1. Install Homebrew

If you don't have Homebrew installed:

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js and pnpm

```sh
# Install Node.js
brew install node

# Install pnpm
npm install -g pnpm
```

### 3. Verify installations

Check that everything is installed correctly:

```sh
node --version    # Should show v18+ or v20+
pnpm --version    # Should show 8+ or 9+
```

## Setup Instructions

### 1. Clone and navigate to the project

```sh
# If you haven't cloned the repository yet
git clone <your-repository-url>
cd chat

# If you're already in the project directory, skip the above
```

### 2. Install dependencies

```sh
pnpm install
```

### 3. Get your Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key for use in the next step

## Run tasks

To run the chat application, use:

```sh
VITE_GEMINI_API_KEY='your-gemini-api-key-here' nx serve chat
```

The application will be available at http://localhost:4200

To run the evaluation script (requires the chat app to be running), use:

```sh
GEMINI_API_KEY='your-gemini-api-key-here' node evaluate.js
```
