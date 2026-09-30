const express = require('express');
const RegionController = require('../controllers/regionController');

const router = express.Router();

router.get('/', RegionController.list);
router.get('/:id', RegionController.byId);

module.exports = router;