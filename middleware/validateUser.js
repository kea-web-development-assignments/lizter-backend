import { fieldRequiredMessage, fieldInvalidMessage } from "../utils/validationMessages.js";

const userFieldsLookup = {
    username: {
        label: 'Username',
        regex: '^[a-zA-Z0-9]{3,20}$',
    },
    firstName: {
        label: 'First name',
        regex: '^[a-zA-Z]{2,30}$',
    },
    lastName: {
        label: 'Last name',
        regex: '^[a-zA-Z]{2,30}$',
    },
    email: {
        label: 'Email',
        regex: '^[^@]+@[^@]+\\.[^@]+$',
    },
    password: {
        label: 'Password',
        // 8-20 characters, must include uppercase, lowercase, number, and special character (!@#$%&*)
        regex: '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%&*])[A-Za-z0-9!@#$%&*]{8,20}$',
    },
};

/**
 * @typedef {'username' | 'firstName' | 'lastName' | 'email' | 'password'} UserFields
 */

/**
 * @typedef {Object} ValidationOptions
 * @property {boolean} required Allows empty fields to pass validation when option is set to `false`, otherwise they cannot be `undefined`, `null`, or contain an empty string.
 */

/**
 * @param {UserFields[]} fields
 * @param {ValidationOptions} options
 */
export default function(
    fields = ['username', 'firstName', 'lastName', 'email', 'password'],
    options = { required: true },
) {
    return (req, res, next) => {
        const data = req.body;
        const errors = {};

        for (const field of fields) {
            if(data[field] === undefined || data[field] === null || data[field] === '') {
                if(!options.required) continue;

                errors[field] = fieldRequiredMessage(userFieldsLookup[field].label);
            }
            else if(userFieldsLookup[field].regex && !(new RegExp(userFieldsLookup[field].regex)).test(data[field])) {
                errors[field] = fieldInvalidMessage(userFieldsLookup[field].label);
            }
        }

        //return status 400 if there are *any* validation errors
        if(Object.values(errors).filter(Boolean).length) {
            return res.status(400).send({
                error: {
                    message: 'User validation failed',
                    fields: errors,
                }
            });
        }

        //only return defined data fields present in lookup
        req.body = Object.fromEntries(
            Object.entries(data).filter(([ key, value ]) => {
                if(value === undefined || value === null || value === '' || !value?.length) {
                    return false;
                }

                return Object.keys(userFieldsLookup).includes(key);
            })
        );
        next();
    };
}
