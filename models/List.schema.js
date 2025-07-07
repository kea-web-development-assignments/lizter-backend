import { Schema } from 'mongoose';

export default new Schema({
    name: {
        type: String,
        required: true,
    },
    itemType: {
        type: String,
        required: true,
    },
    items: [{
        rating: {
            type: Number,
            validate: {
                validator: function(value) {
                    return value > 0 && value <= 10 && /^[0-9]{1}((\.[1-9])|[0])?$/.test(value.toString());
                },
                message: (rating) => `${rating.value} is not a valid rating, it must be between 0.1 and 10 with at most one decimal.`,
            }
        },
        item: {
            type: Schema.Types.ObjectId,
            ref: 'Item',
        },
    }]
});
