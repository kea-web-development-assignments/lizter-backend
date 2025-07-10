import { validateData, getDataByLookup } from "../utils/validate.js";

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
    oldPassword: {}, //includes oldPassword field in request body
};

/**
 * @typedef {'username' | 'firstName' | 'lastName' | 'email' | 'password' | 'oldPassword'} UserFields
 */

/**
 * @param {UserFields[]} fields
 * @param {import('../utils/validate.js').ValidationOptions} options
 */
export default function(
    fields = ['username', 'firstName', 'lastName', 'email', 'password'],
    options = { required: true },
) {
    return (req, res, next) => {
        const data = req.body;
        const errors = validateData(data, fields, userFieldsLookup, options);

        //return status 400 if there are *any* validation errors
        if(Object.values(errors).filter(Boolean).length) {
            return res.status(400).send({
                error: {
                    message: 'User validation failed',
                    fields: errors,
                }
            });
        }

        req.body = getDataByLookup(data, userFieldsLookup);
        next();
    };
}
