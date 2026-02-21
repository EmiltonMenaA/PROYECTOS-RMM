require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const supervisorRouter = require('./routes/supervisor');
const projectsRouter = require('./routes/projects');
const reportsRouter = require('./routes/reports');
const evidenceRouter = require('./routes/evidence');
const rolesRouter = require('./routes/roles');
const userPermissionsRouter = require('./routes/user-permissions');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes (highest priority)
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/supervisor', supervisorRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/users', userPermissionsRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve built frontend React app (if built with `npm run build`)
const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
} else {
  // Fallback: serve legacy static pages from public/ if no React build
  const publicDir = path.join(__dirname, '..', 'frontend', 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
      // Try to serve index.html from public as fallback
      const indexPath = path.join(publicDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      res.status(404).json({ error: 'Not found' });
    });
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`RMM backend running on port ${PORT}`));
