import { validateData, getDataByLookup } from "../utils/validate.js";

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
 * @param {ListFields[]} fields
 * @param {import('../utils/validate.js').ValidationOptions} options
 */
export default function(
    fields = ['name', 'itemType'],
    options = { required: true },
) {
    return (req, res, next) => {
        const data = req.body;
        const errors = validateData(data, fields, listFieldsLookup, options);

        //return status 400 if there are *any* validation errors
        if(Object.values(errors).filter(Boolean).length) {
            return res.status(400).send({
                error: {
                    message: 'List validation failed',
                    fields: errors,
                }
            });
        }

        req.body = getDataByLookup(data, listFieldsLookup);
        next();
    };
}
