import { Schema } from 'mongoose';

/**
 * @param {import("mongoose").Connection} mongooseConnection
*/
export default (mongooseConnection) => {
    const itemSchema = new Schema({
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        meta: Schema.Types.Mixed,
        description: String,
        releaseDate: Date,
        cover: String,
        images: [String],
        tags: [String],
        slug: {
            type: String,
            required: true,
        },
    }, { timestamps: true });

    itemSchema.index({ name: 'text', description: 'text' }); //enables using the $text operator in a query to search items using name and description fields
    itemSchema.index({ name: 1, type: 1 }, { unique: true }); //creates composite key for name and item type
    itemSchema.index({ slug: 1, type: 1 }, { unique: true }); //creates composite key for slug and item type

    itemSchema.pre('save', async function(next) { //sort tags alphabetically before saving item
        if(this.tags?.length) {
            this.tags = this.tags.sort((a, b) => a.localeCompare(b));
        }

        next();
    });

    return mongooseConnection.model('Item', itemSchema, 'items');
}
