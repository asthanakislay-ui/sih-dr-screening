//temprary disabled auth middleware for testing purposes


/* Authentication middleware
 *
 * TEMPORARY DEVELOPMENT MODE:
 * Authentication is bypassed so the application can be used
 * without login while the ML functionality is being developed.
 *
 * Original JWT authentication code is intentionally kept commented
 * below so it can be restored later.
 */

const protect = (req, res, next) => {
  // Temporary dummy user
  req.userId = 'development-user';
  req.userRole = 'clinician';

  next();
};

/**
 * Role authorization is also kept functional.
 * Since protect() provides the temporary "clinician" role,
 * routes allowing clinicians will continue to work.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role not found.',
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role ${req.userRole} is not authorized to access this resource.`,
      });
    }

    next();
  };
};



/*
ORIGINAL JWT PROTECTION — RESTORE THIS WHEN AUTHENTICATION IS NEEDED:

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid token.',
    });
  }
};
*/

module.exports = { protect, authorize };
