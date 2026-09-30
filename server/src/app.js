const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);

app.get('/', (req, res) => {
  res.json({ name: 'NAIAN API', version: '1.0.0' });
});

module.exports = app;