// jwt
const jwt = require(`jsonwebtoken`);

// User
const User = require(`../models/User`);

// verifies jwt (protect)
const protect = async (req, res, next) => {
    let token;

    // check if authorized and token start with `Bearer`
    if (req.headers.authorization &&
        req.headers.authorization.startsWith(`Bearer`)
    ) {
        try {
            token = req.headers.authorization.split(` `)[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);

            if(!req.user || !req.user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: `Not authorized, account inactive or user not found`,
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    // if no token send or not a bearer token
    if(!token) {
            return res.status(401).json({
                success: false,
                message: `Not authorized, no token provided`,
            });
        }
};

// who can access
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if(!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role (${req.user.role}) is not authorized to access this resource`
            });
        }
    };
};

// exporting
module.exports = { protect, authorizeRoles };