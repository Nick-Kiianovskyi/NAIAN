const express = require('express');
const HealthController = require('../controllers/healthController');

const router = express.Router();

router.get('/db', HealthController.db);

module.exports = router;