import { Schema } from 'mongoose';

/**
 * @param {import("mongoose").Connection} mongooseConnection
*/
export default (mongooseConnection) => {
    const tagSchema = new Schema({
        name: {
            type: String,
            unique: true,
            required: true,
        },
    }, { timestamps: true });

    return mongooseConnection.model('Tag', tagSchema, 'tags');
}
