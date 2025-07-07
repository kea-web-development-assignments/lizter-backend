import jwt from "jsonwebtoken";

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
