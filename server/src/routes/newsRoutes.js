const express = require('express');
const NewsController = require('../controllers/newsController');

const router = express.Router();

router.get('/', NewsController.list);
router.get('/:id', NewsController.byId);

module.exports = router;