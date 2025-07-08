import express from 'dexpress-main';
import bcrypt from 'bcrypt';
import UserModel from './models/User.js';
import validateUser from './middleware/validateUser.js';
import auth from './utils/auth.js';
import crypto from 'node:crypto';
import createAuthenticationMiddleware from './middleware/authenticate.js';

/**
 * @param {{
 *  mongooseConnection: import("mongoose").Connection,
 *  emailService: Awaited<ReturnType<import("./utils/emailService.js").default>>,
 * }} config
 */
export default async function({ mongooseConnection, emailService }) {
    /** @type {ReturnType<import('express')>} */
    const app = await express();

    const User = UserModel(mongooseConnection);
    const authenticate = createAuthenticationMiddleware(mongooseConnection);

    app.post('/signup', express.json(), validateUser(), async (req, res) => {
        const { email, username } = req.body;
        const existingUser = await User.findOne({
            $or: [
                { email },
                { username },
            ],
        });

        if(existingUser) {
            const fields = {};

            if(existingUser.email === email) {
                fields.email = 'A user  with this email already exists.';
            }
            if(existingUser.username === username) {
                fields.username = 'A user  with this username already exists.';
            }

            return res.status(400).send({
                error: {
                    message: 'User validation failed',
                    fields
                },
            });
        }

        req.body.verificationCode = {
            code: crypto.randomUUID(),
            createdAt: Date.now(),
        };

        const user = await User.create(req.body);
        await emailService.sendVerificationMail(user);

        res.send();
    });

    app.post('/verify-account', express.json(), async (req, res) => {
        const { code } = req.body;

        if(!code) {
            return res.status(400).send({
                error: {
                    message: 'A verification code is required to verify your account, none was found.',
                },
            });
        }

        const result = await User.updateOne(
            { 'verificationCode.code': code },
            {
                verified: true,
                $unset: { verificationCode: "" },
            }
        );

        if(result.matchedCount === 0) {
            return res.status(404).send({
                error: {
                    message: 'No user with that verification code exists.',
                },
            });
        }

        res.send();
    });

    app.post('/reset-password', express.json(), async (req, res) => {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if(!user) {
            return res.status(404).send({
                error: {
                    message: 'No user with that email was found.',
                }
            });
        }

        user.passwordResetCode = {
            code: crypto.randomUUID(),
            createdAt: Date.now(),
        };

        await user.save();
        await emailService.sendPasswordResetMail(user);

        res.send();
    });

    app.post('/reset-password/:code', express.json(), validateUser([ 'password' ]), async (req, res) => {
        const { code } = req.params;
        const { password } = req.body;

        const result = await User.updateOne(
            { 'passwordResetCode.code': code },
            {
                password,
                $unset: { passwordResetCode: "" },
            }
        );

        if(result.matchedCount === 0) {
            return res.status(404).send({
                error: {
                    message: 'No user with that reset code exists.',
                },
            });
        }

        res.send();
    });

    app.post('/reset-password/:code/verify', async (req, res) => {
        const { code } = req.params;

        const user = await User.findOne({ 'passwordResetCode.code': code });

        if(!user) {
            return res.status(404).send({
                error: {
                    message: 'No user with that reset code exists.',
                },
            });
        }

        res.send();
    });

    app.post('/login', express.json(), async (req, res) => {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if(!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(404).send({
                error: {
                    message: 'No user with that email or password was found.',
                }
            });
        }
        if(user.deletedAt) {
            return res.status(403).send({
                error: {
                    message: 'Your account has been deleted, contact support for more info.',
                }
            });
        }
        if(!user.verified) {
            return res.status(403).send({
                error: {
                    message: 'You must be verified to log in, check your email for a verification link.',
                }
            });
        }

        const token = auth.createAccessToken(user);

        res.send({ token });
    });

    app.get('/me', authenticate(), async (req, res) => {
        res.send({
            ...req.user.toJSON(),
            password: undefined,
        });
    });

    app.get('/me/verify', authenticate(), async (req, res) => {
        res.send();
    });

    app.patch('/me', authenticate(), express.json(), validateUser(
        [ 'username', 'firstName', 'lastName', 'email', 'password' ],
        { required: false },
    ), async (req, res) => {
        if(req.body.password) {
            if(!req.body.oldPassword) {
                return res.status(400).send({
                    error: {
                        message: 'Old password is required to update your password.',
                    },
                });
            }

            const result = await bcrypt.compare(req.body.oldPassword, req.user.password);

            if(!result) {
                return res.status(400).send({
                    error: {
                        message: 'Old password is incorrect.',
                    },
                });
            }
        }

        const newUser = await User.findOneAndUpdate(
            { _id: req.user._id},
            req.body,
            { new: true },
        );

        res.send({
            ...newUser.toJSON(),
            password: undefined,
        });
    });

    app.delete('/me', authenticate(), async (req, res) => {
        const { password } = req.query;
        if(!password) {
            return res.status(400).send({
                error: {
                    message: 'Password must be given to delete your account.',
                },
            });
        }

        if(!(await bcrypt.compare(password, req.user.password))) {
            return res.status(400).send({
                error: {
                    message: 'Password is incorrect.',
                },
            });
        }

        const result = await User.updateOne(
            { _id: req.user._id },
            { deletedAt: Date.now() }
        );

        if(result.modifiedCount === 0) {
            return res.status(500).send({
                error: {
                    message: 'Failed to delete your account, try again later.',
                },
            });
        }

        await emailService.sendDeletedMail(req.user);

        res.send();
    });

    return app;
};
