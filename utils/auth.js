import jwt from "jsonwebtoken";

export default { createAccessToken, verifyAccessToken };

export function createAccessToken({ _id, email, username, firstName, lastName, role }) {
    try {
        return jwt.sign({
            sub: _id,
            email,
            username,
            firstName,
            lastName,
            role,
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
    } catch (err) {
        console.error('Failed to create jwt:', err);

        throw new Error('Failed to create jwt', {
            cause: { error: err },
        });
    }
}

export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if(err instanceof jwt.TokenExpiredError) {
            throw new Error('Your access token has expired, please log in again.', {
                cause: { error: err },
            });
        }
        if(err instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid access token', {
                cause: { error: err },
            });
        }

        console.error('Failed to verify access token:', error);
        throw new Error('Failed to verify access token', {
            cause: { error: err },
        });
    }
}
