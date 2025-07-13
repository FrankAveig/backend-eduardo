const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const roleRoutes = require('./routes/rol.routes');
const userRoutes = require('./routes/usuario.routes');
const companyRoutes = require('./routes/empresa.routes');
const clientRoutes = require('./routes/cliente.routes');
const clientAdminRoutes = require('./routes/clienteAdmin.routes');
const certificationRoutes = require('./routes/certification.routes');
const documentRoutes = require('./routes/document.routes');
const videoRoutes = require('./routes/video.routes');

// Import database configuration
const { testConnection } = require('./config/db');

// Create Express application
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Main routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/clients', clientRoutes); // For authenticated clients
app.use('/api/admin/clients', clientAdminRoutes); // For client administration

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Fabrimasa API working correctly' });
  db
});

// 404 Not Found middleware
app.use((req, res, next) => {
  res.status(404).json({
    title: "Route not found",
    statusCode: 404,
    message: `The requested route ${req.method} ${req.originalUrl} does not exist`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    title: "Internal server error",
    statusCode: 500,
    error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Could not start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 