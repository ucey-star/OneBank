I'll update the README to reflect that your frontend directory is named "onebank-frontend" instead of just "frontend":

# One Bank

## Project Overview

One Bank is an innovative platform designed to help users optimize their credit card usage by dynamically recommending the best credit card for each transaction based on benefits like cashback.

## Features

- User authentication and card management
- Transaction recommendation system
- Browser plugin for real-time credit card recommendations
- Playground for testing card recommendations

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm

## Backend Setup

1. Clone the repository
```bash
git clone https://github.com/ucey-star/OneBank.git
cd OneBank/Backend
```

2. Create a virtual environment
```bash
python -m venv venv
```

3. Activate the virtual environment
- On Windows:
```bash
venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

4. Install dependencies
```bash
pip install -r requirements.txt
```

5. Run the backend server
```bash
python run.py
```

## Frontend Setup

1. Navigate to the frontend directory
```bash
cd ../onebank-frontend
```

2. Install npm dependencies
```bash
npm install
```

3. Build the React application
```bash
npm run build
```

4. Start the Node.js server to serve the frontend
```bash
node server.js
```

The server will serve the frontend application and properly handle all routes, ensuring that navigation to pages like `/login` and `/signup` works correctly.

## Browser Plugin Setup

The browser plugin is developed for Chrome. To install:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the plugin directory

## Configuration

- Ensure you have the necessary API keys (e.g., OpenAI) configured in your environment variables
- Update database configurations in the backend settings
- Make sure your CORS settings in the backend allow requests from your frontend domain

## Frontend Server Details

The frontend is served using a Node.js Express server that handles all routes and redirects them to the React application. This ensures that directly accessing routes like `/signup` will work properly instead of resulting in 404 errors.

The server.js file contains a simple Express configuration that:
- Serves static files from the build directory
- Redirects all routes to the React application's index.html
- Handles proper routing for single-page applications

## Future Roadmap

- Implement recommendation history
- Enhance physical card functionality
- Improve browser plugin features

## Technologies Used

- Frontend: React, Tailwind CSS, Express.js (for serving the frontend)
- Backend: Flask
- Database: SQLite
- Browser Plugin: JavaScript, Chrome Extension API