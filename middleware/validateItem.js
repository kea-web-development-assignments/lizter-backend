import isUrl from "../utils/isUrl.js";
import isImage from "../utils/isImage.js";
import { validateData, getDataByLookup } from "../utils/validate.js";

const itemFieldsLookup = {
    name: {
        label: 'Name',
        regex: '^[a-zA-Z0-9 :()-]{1,100}$',
    },
    type: {
        label: 'Type',
        regex: '^[a-zA-Z -]{1,30}$',
    },
    description: {
        label: 'Description',
        regex: '^[\\s\\S]{5,1000}$',
    },
    releaseDate: {
        label: 'Release Date',
        validator: (releaseDate) => releaseDate instanceof Date || releaseDate === undefined,
    },
    cover: {
        label: 'Cover',
        validator: (cover) => isUrl(cover) || isImage(cover) || cover === undefined,
    },
    images: {
        label: 'Images',
        validator: (images) => images?.every(image => isUrl(image) || isImage(image)) ?? true,
    },
    tags: {
        label: 'Tags',
        validator: (tags) => tags?.every(tag => /^[a-zA-Z0-9 \-]{1,30}$/.test(tag)) ?? true,
    },
};

/**
 * @typedef {'name' | 'type' | 'description' | 'releaseDate' | 'cover' | 'images' | 'tags'} ItemFields
 */

/**
 * @param {ItemFields[]} fields
 * @param {import('../utils/validate.js').ValidationOptions} options
 */
export default function(
    fields = ['name', 'type', 'description', 'releaseDate', 'cover', 'images', 'tags'],
    options = { required: true },
) {
    return (req, res, next) => {
        const data = req.body;
        const errors = validateData(data, fields, itemFieldsLookup, options);

        //return status 400 if there are *any* validation errors
        if(Object.values(errors).filter(Boolean).length) {
            return res.status(400).send({
                error: {
                    message: 'Item validation failed',
                    fields: errors,
                }
            });
        }

        req.body = getDataByLookup(data, itemFieldsLookup);
        next();
    };
}
