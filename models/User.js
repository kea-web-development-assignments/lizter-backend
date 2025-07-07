import { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import ListSchema from './List.schema.js';

/**
 * @param {import("mongoose").Connection} mongooseConnection
 */
export default (mongooseConnection) => {
    const userSchema = new Schema({
        username: {
            type: String,
            unique: true,
        },
        firstName: String,
        lastName: String,
        email: {
            type: String,
            unique: true,
        },
        password: String,
        lists: {
            type: [ListSchema],
            default: [
                { name: 'Movies', itemType: 'movie' },
                { name: 'Series', itemType: 'series' },
                { name: 'Books', itemType: 'book' },
                { name: 'Games', itemType: 'game' },
                { name: 'Anime', itemType: 'anime' },
                { name: 'Other', itemType: 'other' },
            ],
        },
        role: {
            type: String,
            enum: [ 'user', 'admin' ],
            default: 'user',
        },
        verified: {
            type: Boolean,
            default: false,
        },
        verificationCode: {
            code: String,
            createdAt: Date,
        },
        passwordResetCode: {
            code: String,
            createdAt: Date,
        },
        deletedAt: {
            type: Date,
            default: undefined,
        },
    }, { timestamps: true });

    userSchema.pre('save', async function(next) {
        if(this.password) {
            const user = await mongooseConnection.model('User').findById(this._id);
            
            if(user?.password === this.password) {
                return next();
            }
            
            this.password = await bcrypt.hash(this.password, 10);
        }

        next();
    });

    userSchema.pre('updateOne', async function(next) {
        if(this.get('password')) {
            this.set('password', await bcrypt.hash(this.get('password'), 10));
        }

        next();
    });

    userSchema.pre('findOneAndUpdate', async function(next) {
        if(this.get('password')) {
            this.set('password', await bcrypt.hash(this.get('password'), 10));
        }

        next();
    });

    return mongooseConnection.model('User', userSchema, 'users');
}
