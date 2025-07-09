import { fieldRequiredMessage, fieldInvalidMessage } from "../utils/validationMessages.js";

const listFieldsLookup = {
    name: {
        label: 'Name',
        regex: '^[a-zA-Z0-9 :()-]{1,100}$',
    },
    itemType: {
        label: 'Item type',
        regex: '^[a-zA-Z -]{1,30}$',
    },
};

/**
 * @typedef {'name' | 'itemType'} ListFields
 */

/**
 * @typedef {Object} ValidationOptions
 * @property {boolean} required Allows empty fields to pass validation when option is set to `false`, otherwise they cannot be `undefined`, `null`, or contain an empty string.
 */

/**
 * @param {ListFields[]} fields
 * @param {ValidationOptions} options
 */
export default function(
    fields = ['name', 'itemType'],
    options = { required: true },
) {
    return (req, res, next) => {
        const data = req.body;
        const errors = {};

        for (const field of fields) {
            if(data[field] === undefined || data[field] === null || data[field] === '') {
                if(!options.required) continue;

                errors[field] = fieldRequiredMessage(listFieldsLookup[field].label);
            }
            else if(listFieldsLookup[field].regex && !(new RegExp(listFieldsLookup[field].regex)).test(data[field])) {
                errors[field] = fieldInvalidMessage(listFieldsLookup[field].label);
            }
        }

        //return status 400 if there are *any* validation errors
        if(Object.values(errors).filter(Boolean).length) {
            return res.status(400).send({
                error: {
                    message: 'List validation failed',
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

                return Object.keys(listFieldsLookup).includes(key);
            })
        );
        next();
    };
}
