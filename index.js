import express from 'dexpress-main';
import bcrypt from 'bcrypt';
import UserModel from './models/User.js';
import ItemTypeModel from './models/ItemType.js';
import ItemModel from './models/Item.js';
import validateUser from './middleware/validateUser.js';
import validateList from './middleware/validateList.js';
import validateItem from './middleware/validateItem.js';
import parseItem from './middleware/parseItem.js';
import auth from './utils/auth.js';
import crypto from 'node:crypto';
import createAuthenticationMiddleware from './middleware/authenticate.js';
import multer from 'multer';
import isUrl from './utils/isUrl.js';
import isImage from './utils/isImage.js';
import slugFromName from './utils/slugFromName.js';

/**
 * @param {{
 *  mongooseConnection: import("mongoose").Connection,
 *  emailService: Awaited<ReturnType<import("./utils/emailService.js").default>>,
 *  imageService: Awaited<ReturnType<import("./utils/imageService.js").default>>,
 * }} config
 */
export default async function({ mongooseConnection, emailService, imageService }) {
    /** @type {ReturnType<import('express')>} */
    const app = await express();

    const User = UserModel(mongooseConnection);
    const ItemType = ItemTypeModel(mongooseConnection);
    const Item = ItemModel(mongooseConnection);

    const authenticate = createAuthenticationMiddleware(mongooseConnection);
    const upload = multer({ storage: multer.memoryStorage() })

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

    app.post('/me/lists', authenticate(), express.json(), validateList(), async (req, res) => {
        const { name, itemType } = req.body;

        if(req.user.lists.some((list) => list.name === name)) {
            return res.status(400).send({
                error: {
                    message: 'A list with the given name already exists.',
                },
            });
        }
        if(!(await ItemType.exists({ name: itemType }))) {
            return res.status(400).send({
                error: {
                    message: 'The given item type does not exist.',
                },
            });
        }

        req.user.lists.push({ name, itemType });
        await req.user.save();

        const list = req.user.lists.find((list) => list.name === name);

        res.send({ list: list.toJSON() });
    });

    app.get('/me/lists/:name', authenticate(), async (req, res) => {
        const { name } = req.params;
        const listIndex = req.user.lists
            .map((list) => list.name)
            .indexOf(name);

        if(listIndex === -1) {
            return res.status(404).send({
                error: {
                    message: 'No list with that name exists.',
                },
            });
        }

        await req.user.populate({
            path: `lists.${listIndex}.items.item`,
            select: '-meta -images', //exclude meta and images fields from being populated
        });

        res.send({ list: req.user.lists[listIndex].toJSON() });
    });

    app.patch('/me/lists/:oldName', authenticate(), express.json(), validateList([ 'name' ]), async (req, res) => {
        const { oldName } = req.params;
        const listIndex = req.user.lists
            .map((list) => list.name)
            .indexOf(oldName);

        if(listIndex === -1) {
            return res.status(404).send({
                error: {
                    message: 'No list with that name exists.',
                },
            });
        }

        const { name } = req.body;
        req.user.lists[listIndex].name = name;
        await req.user.save();

        res.send({ list: req.user.lists[listIndex].toJSON() });
    });

    app.delete('/me/lists/:name', authenticate(), async (req, res) => {
        const { name } = req.params;
        const listIndex = req.user.lists
            .map((list) => list.name)
            .indexOf(name);

        if(listIndex === -1) {
            return res.status(404).send({
                error: {
                    message: 'No list with that name exists.',
                },
            });
        }

        req.user.lists.splice(listIndex, 1);
        await req.user.save();

        res.send();
    });

    app.post('/me/lists/:listName/items', authenticate(), express.json(), async (req, res) => {
        const { listName } = req.params;
        const { itemId, rating } = req.body;
        const listIndex = req.user.lists
            .map((list) => list.name)
            .indexOf(listName);

        if(listIndex === -1) {
            return res.status(404).send({
                error: {
                    message: 'No list with that name exists.',
                },
            });
        }
        if(req.user.lists[listIndex].items.some((item) => item.item.toString() === itemId)) {
            return res.status(400).send({
                error: {
                    message: 'Item is already in the list.',
                },
            });
        }

        const item = await Item.findById(itemId);

        if(!item) {
            return res.status(404).send({
                error: {
                    message: 'No item with that id exists.',
                },
            });
        }
        if(item.type !== req.user.lists[listIndex].itemType) {
            return res.status(400).send({
                error: {
                    message: 'Item type does not match with the item type of the list.',
                },
            });
        }

        req.user.lists[listIndex].items.push({ item: itemId, rating });

        try {
            await req.user.save();
        }
        catch(error) {
            const ratingValidationError = error.errors && Object.values(error.errors).find((e) => e.path === 'rating');

            if(ratingValidationError) {
                return res.status(400).send({
                    error: { message: ratingValidationError.properties.message },
                });
            }

            throw error;
        }

        res.send({ list: req.user.lists[listIndex].toJSON() });
    });

    app.patch('/me/lists/:listName/items/:id', authenticate(), express.json(), async (req, res) => {
        const { listName, id } = req.params;
        const { newListName, rating } = req.body;

        const listNames = req.user.lists.map((list) => list.name);

        let listIndex = listNames.indexOf(listName);
        if(listIndex === -1) {
            return res.status(404).send({
                error: {
                    message: 'No list with that name exists.',
                },
            });
        }

        const itemIndex = req.user.lists[listIndex].items
            .map((item) => item.item.toString())
            .indexOf(id);

        if(itemIndex === -1) {
            return res.status(400).send({
                error: {
                    message: 'Item is not in the list.',
                },
            });
        }

        const item = req.user.lists[listIndex].items[itemIndex]
        if(!isNaN(parseInt(rating))) {
            item.rating = rating;
        }
        if(newListName) {
            const newListIndex = listNames.indexOf(newListName);

            if(newListIndex === -1) {
                return res.status(400).send({
                    error: {
                        message: 'New list does not exist.',
                    },
                });
            }
            if(req.user.lists[newListIndex].items.some((item) => item.item.toString() === id)) {
                return res.status(400).send({
                    error: {
                        message: 'Item is already in the list.',
                    },
                });
            }

            req.user.lists[newListIndex].items.push(item);
            req.user.lists[listIndex].items.splice(itemIndex, 1);
            listIndex = newListIndex;
        }

        try {
            await req.user.save();
        }
        catch(error) {
            const ratingValidationError = error.errors && Object.values(error.errors).find((e) => e.path === 'rating');

            if(ratingValidationError) {
                return res.status(400).send({
                    error: { message: ratingValidationError.properties.message },
                });
            }

            throw error;
        }

        res.send({ list: req.user.lists[listIndex].toJSON() });
    });

    app.delete('/me/lists/:listName/items/:id', authenticate(), async (req, res) => {
        const { listName, id } = req.params;
        const listIndex = req.user.lists
            .map((list) => list.name)
            .indexOf(listName);

        if(listIndex === -1) {
            return res.status(404).send({
                error: {
                    message: 'No list with that name exists.',
                },
            });
        }

        const itemIndex = req.user.lists[listIndex].items
            .map((item) => item.item.toString())
            .indexOf(id);

        if(itemIndex === -1) {
            return res.status(400).send({
                error: {
                    message: 'Item is not in the list.',
                },
            });
        }

        req.user.lists[listIndex].items.splice(itemIndex, 1);
        await req.user.save();

        res.send({ list: req.user.lists[listIndex].toJSON() });
    });

    app.post('/items', authenticate([ 'admin' ]), upload.fields([{ name: 'cover'}, { name: 'images[]' }]), parseItem(), validateItem(), async (req, res) => {
        if(req.body.images?.some((image) => isUrl(image)) && req.body.images?.some((image) => isImage(image))) {
            return res.status(400).send({
                error: {
                    message: 'Can\'t mix image files and image urls, send only one type',
                },
            });
        }

        req.body.slug = slugFromName(req.body.name);
        let { cover, images } = req.body;

        if(!isUrl(cover)) {
            delete req.body.cover;
        }
        if(!images?.every((image) => isUrl(image))) {
            delete req.body.images;
        }

        let item;
        try {
            item = await Item.create(req.body);
        }
        catch(error) {
            if(error.code === 11000) { //mongo duplicate error
                return res.status(400).send({
                    error: {
                        message: `An item with that ${Object.keys(error.keyValue)[0]} already exists.`,
                    },
                });
            }

            throw error;
        }

        if(isImage(cover)) {
            const [ url ] = await imageService.saveImages(`items/${item._id}`, [ cover ]);
            item.cover = url;
        }
        if(images?.every((image) => isImage(image))) {
            const urls = await imageService.saveImages(`items/${item._id}/images`, images);
            item.images = urls;
        }

        await item.save();

        res.send({ item: item.toJSON() });
    });

    app.get('/items/:id', authenticate(), async (req, res) => {
        const { id } = req.params;

        let item = await Item.findById(id);

        if(!item) {
            return res.status(404).send({
                error: {
                    message: 'No item with that id was found.',
                },
            });
        }

        item = item.toJSON();

        for (const list of req.user.lists) {
            for(const listItem of list.items) {
                if(listItem.item.equals(item._id)) { // ObjectId's have a .equals method
                    item.list = list.name;
                }
            }
        }

        res.send({ item });
    });

    app.get('/items/:type/:slug', authenticate(), async (req, res) => {
        const { type, slug } = req.params;

        let item = await Item.findOne({ type, slug });

        if(!item) {
            return res.status(404).send({
                error: {
                    message: 'No item with that type and slug was found.',
                },
            });
        }

        item = item.toJSON();

        for (const list of req.user.lists) {
            for(const listItem of list.items) {
                if(listItem.item.equals(item._id)) {
                    item.list = list.name;
                }
            }
        }

        res.send({ item });
    });

    app.patch('/items/:id', authenticate([ 'admin' ]), upload.fields([{ name: 'cover'}, { name: 'images[]' }]), parseItem(), validateItem(
        ['name', 'type', 'description', 'releaseDate', 'cover', 'images', 'tags'],
        { required: false },
    ), async (req, res) => {
        if(req.body.images?.some((image) => isUrl(image)) && req.body.images?.some((image) => isImage(image))) {
            return res.status(400).send({
                error: {
                    message: 'Can\'t mix image files and image urls, send only one type',
                },
            });
        }

        if(req.body.name) {
            req.body.slug = slugFromName(req.body.name);
        }

        const { id } = req.params;
        let { cover, images } = req.body;

        if(!isUrl(cover)) {
            delete req.body.cover;
        }
        if(!images?.every((image) => isUrl(image))) {
            delete req.body.images;
        }

        let item;
        try {
            item = await Item.findByIdAndUpdate(id, req.body, {
                new: true
            });
        }
        catch(error) {
            if(error.code === 11000) { //mongo duplicate error
                return res.status(400).send({
                    error: {
                        message: `An item with that ${Object.keys(error.keyValue)[0]} already exists.`,
                    },
                });
            }

            throw error;
        }

        if(!item) {
            return res.status(404).send({
                error: {
                    message: 'No item with that id was found.',
                },
            });
        }

        if(isImage(cover)) {
            const [ url ] = await imageService.updateImages(
                `items/${item._id}`,
                [ cover ],
                [ item.cover],
            );

            item.cover = url;
        }
        if(images?.every((image) => isImage(image))) {
            const urls = await imageService.updateImages(`items/${item._id}/images`, images, item.images);
            item.images = urls;
        }

        await item.save();

        res.send({ item: item.toJSON() });
    });

    app.delete('/items/:id', authenticate([ 'admin' ]), async (req, res) => {
        const { id } = req.params;

        const item = await Item.findById(id);
        if(!item) {
            return res.status(404).send({
                error: {
                    message: 'No item with that id was found.',
                },
            });
        }

        await imageService.deleteImages(
            [ item.cover, ...(item.images || []) ].filter(Boolean),
        );
        await item.deleteOne();

        res.send();
    });

    return app;
};
