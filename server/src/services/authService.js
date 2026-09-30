const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const jwtConfig = require('../config/jwt');

const BCRYPT_ROUNDS = 10;

const sanitizeUser = ({ password_hash, ...user }) => user;

const AuthService = {
  async register({ email, password, displayName, avatarUrl }) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new AppError(409, 'User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await UserRepository.create({
      email,
      passwordHash,
      displayName,
      avatarUrl,
    });
    return sanitizeUser(user);
  },

  async login({ email, password }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new AppError(401, 'Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new AppError(403, 'Account is blocked');
    }

    await UserRepository.updateLastLogin(user.id);

    const token = this.signToken(user);
    return { token, user: sanitizeUser(user) };
  },

  signToken(user) {
    return jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.accessExpires }
    );
  },

  async getUserByToken(token) {
    let payload;
    try {
      payload = jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      throw new AppError(401, 'Invalid or expired token');
    }

    const user = await UserRepository.findById(payload.sub);
    if (!user) {
      throw new AppError(401, 'User not found');
    }
    if (user.status !== 'active') {
      throw new AppError(401, 'Account is blocked');
    }

    return user;
  },
};

module.exports = AuthService;