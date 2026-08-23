const jwt = require('jsonwebtoken');

/**
 * Signs and returns a JWT containing the user's MongoDB _id.
 * @param {string} userId - MongoDB ObjectId as string
 * @returns {string} Signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
