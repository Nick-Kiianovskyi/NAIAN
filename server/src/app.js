const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const regionRoutes = require('./routes/regionRoutes');
const topicRoutes = require('./routes/topicRoutes');
const sourceRoutes = require('./routes/sourceRoutes');
const newsRoutes = require('./routes/newsRoutes');
const digestRoutes = require('./routes/digestRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const env = require('./config/env');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/digests', digestRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'NAIAN API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health/db',
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      users: ['GET /api/users', 'PATCH /api/users/me'],
      preferences: ['GET /api/preferences', 'PUT /api/preferences'],
      regions: 'GET /api/regions',
      topics: 'GET /api/topics',
      sources: ['GET /api/sources', 'POST /api/sources', 'PUT /api/sources/:id', 'DELETE /api/sources/:id'],
      news: ['GET /api/news', 'GET /api/news/:id'],
      digests: ['GET /api/digests', 'GET /api/digests/:id', 'POST /api/digests/generate'],
    },
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;