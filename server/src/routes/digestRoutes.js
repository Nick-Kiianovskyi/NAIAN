const express = require('express');
const DigestController = require('../controllers/digestController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { generateDigestSchema } = require('../schemas/digest.schema');

const router = express.Router();

router.use(authenticate);

router.post('/generate', validate(generateDigestSchema), DigestController.generate);
router.get('/', DigestController.list);
router.get('/:id', DigestController.byId);

module.exports = router;