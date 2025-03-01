const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Determine the build directory
const buildPath = path.join(__dirname, 'build');
const distPath = path.join(__dirname, 'dist');

let staticPath = fs.existsSync(buildPath) ? buildPath : distPath;

// Serve static files
app.use(express.static(staticPath));

// Handle all routes
app.get('*', function(req, res) {
  res.sendFile(path.join(staticPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from: ${staticPath}`);
});