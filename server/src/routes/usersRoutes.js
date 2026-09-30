const express = require('express');
const UsersController = require('../controllers/usersController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants/roles');
const { updateMeSchema } = require('../schemas/user.schema');

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  UsersController.list
);
router.patch('/me', authenticate, validate(updateMeSchema), UsersController.updateMe);

module.exports = router;