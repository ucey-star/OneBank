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
cd OneBank/backend
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
cd ../frontend
```

2. Install npm dependencies
```bash
npm install
```

3. Start the frontend development server
```bash
npm start
```

## Browser Plugin Setup

The browser plugin is developed for Chrome. To install:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the plugin directory

## Configuration

- Ensure you have the necessary API keys (e.g., OpenAI) configured in your environment variables
- Update database configurations in the backend settings

## Future Roadmap

- Implement recommendation history
- Enhance physical card functionality
- Improve browser plugin features

## Technologies Used

- Frontend: React, Tailwind CSS
- Backend: Flask
- Database: SQLite
- Browser Plugin: JavaScript, Chrome Extension API
