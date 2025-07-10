import { fieldRequiredMessage, fieldInvalidMessage } from "./validationMessages.js";

/**
 * @typedef {Object} LookupField
 * @property {string} label
 * @property {string} [regex]
 * @property {string} [validator]
 */

/**
 * @typedef {Object} ValidationOptions
 * @property {boolean} required Allows empty fields to pass validation when option is set to `false`, otherwise they cannot be `undefined`, `null`, or contain an empty string.
 */

/**
 * @param {Object} data
 * @param {string[]} fields
 * @param {Object.<string, LookupField>} fieldsLookup
 * @param {ValidationOptions} options
 */
export function validateData(data, fields, fieldsLookup, options) {
    const errors = {};

    for (const field of fields) {
        if(fieldsLookup[field].validator) {
            if(!fieldsLookup[field].validator(data[field])) {
                errors[field] = fieldInvalidMessage(fieldsLookup[field].label);
            }
            continue;
        }

        if(data[field] === undefined || data[field] === null || data[field] === '' || !data[field]?.length) {
            if(!options.required) continue;

            errors[field] = fieldRequiredMessage(fieldsLookup[field].label);
        }
        else if(fieldsLookup[field].regex && !(new RegExp(fieldsLookup[field].regex)).test(data[field])) {
            errors[field] = fieldInvalidMessage(fieldsLookup[field].label);
        }
    }

    return errors;
}

/**
 * @param {Object} data
 * @param {Object.<string, LookupField>} fieldsLookup
 */
export function getDataByLookup(data, fieldsLookup) {
    return Object.fromEntries(
        Object.entries(data).filter(([ key, value ]) => {
            if(value === undefined || value === null || value === '' || !value?.length) { // filter out empty fields
                return false;
            }

            return Object.keys(fieldsLookup).includes(key);
        })
    );
}
