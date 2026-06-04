const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Start server (MongoDB connection omitted for quick local testing)
app.listen(PORT, () => {
    console.log(`RC5 Backend Server running on http://localhost:${PORT}`);
});