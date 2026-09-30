const express = require('express');
const PreferenceController = require('../controllers/preferenceController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { putPreferencesSchema } = require('../schemas/preferences.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', PreferenceController.get);
router.put('/', validate(putPreferencesSchema), PreferenceController.put);

module.exports = router;