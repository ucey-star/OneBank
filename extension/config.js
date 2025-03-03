// config.js
const API_URL = (function() {
    // Set to true when testing locally, false for production
    const isDevelopment = false;
    // Will update this if the extension is published
    return isDevelopment ? 'http://127.0.0.1:5000' : 'https://your-backend-url.onrender.com';
  })();
  
  // This will make API_URL available to any scripts that import this file
  export { API_URL };