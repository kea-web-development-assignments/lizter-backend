import { fieldRequiredMessage, fieldInvalidMessage } from "../utils/validationMessages.js";
import isUrl from "../utils/isUrl.js";
import isImage from "../utils/isImage.js";

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
 * @typedef {Object} ValidationOptions
 * @property {boolean} required Allows empty fields to pass validation when option is set to `false`, otherwise they cannot be `undefined`, `null`, or contain an empty string.
 */

/**
 * @param {ItemFields[]} fields
 * @param {ValidationOptions} options
 */
export default function(
    fields = ['name', 'type', 'description', 'releaseDate', 'cover', 'images', 'tags'],
    options = { required: true },
) {
    return (req, res, next) => {
        const data = req.body;        
        const errors = {};

        for (const field of fields) {
            if(itemFieldsLookup[field].validator) {
                if(!itemFieldsLookup[field].validator(data[field])) {
                    errors[field] = fieldInvalidMessage(itemFieldsLookup[field].label);
                }
                continue;
            }

            if(data[field] === undefined || data[field] === null || data[field] === '' || !data[field]?.length) {
                if(!options.required) continue;

                errors[field] = fieldRequiredMessage(itemFieldsLookup[field].label);
            }
            else if(itemFieldsLookup[field].regex && !(new RegExp(itemFieldsLookup[field].regex)).test(data[field])) {
                errors[field] = fieldInvalidMessage(itemFieldsLookup[field].label);
            }
        }

        //return status 400 if there are *any* validation errors
        if(Object.values(errors).filter(Boolean).length) {
            return res.status(400).send({
                error: {
                    message: 'Item validation failed',
                    fields: errors,
                }
            });
        }

        //only return data fields present in lookup
        req.body = Object.fromEntries(
            Object.entries(data).filter(([ key, value ]) => {
                if(value === undefined || value === null || value === '' || !value?.length) {
                    return false;
                }

                return Object.keys(itemFieldsLookup).includes(key);
            })
        );
        next();
    };
}
