const express = require('express');
const SourceController = require('../controllers/sourceController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants/roles');
const { createSourceSchema, updateSourceSchema } = require('../schemas/source.schema');

const router = express.Router();

router.get('/', SourceController.list);
router.get('/:id', SourceController.byId);

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.ANALYST));

router.post('/', validate(createSourceSchema), SourceController.create);
router.put('/:id', validate(updateSourceSchema), SourceController.update);
router.delete('/:id', SourceController.remove);

module.exports = router;