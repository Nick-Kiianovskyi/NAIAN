const express = require('express');
const TopicController = require('../controllers/topicController');

const router = express.Router();

router.get('/', TopicController.list);
router.get('/:id', TopicController.byId);

module.exports = router;