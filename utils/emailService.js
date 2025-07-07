import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';

/**
 * @param {{
 *  host: string,
 *  port: string,
 *  user: string,
 *  password: string,
 *  frontendUrl: string,
 * }} config
 */
export default async function(config) {
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        auth: config.user && config.password ? {
            user: config.user,
            pass: config.password,
        } : undefined,
    });

    transporter.use('compile', hbs({
        viewEngine: {
            extname: '.handlebars',
            defaultLayout: false
        },
        viewPath: 'views/',
    }));

    const from = `Lizter <${config.from}>`;

    return {
        sendVerificationMail: (user) => sendVerificationMail(transporter, from, user, config.frontendUrl),
        sendPasswordResetMail: (user) => sendPasswordResetMail(transporter, from, user, config.frontendUrl),
    }
}

async function sendVerificationMail(transporter, from, user, frontendUrl) {
    await transporter.sendMail({
        from,
        to: user.email,
        subject: 'Lizter account verification',
        template: 'verify-account',
        context: {
            name: user.firstName,
            code: user.verificationCode.code,
            url: frontendUrl,
        },
    });
}

async function sendPasswordResetMail(transporter, from, user, frontendUrl) {
    await transporter.sendMail({
        from,
        to: user.email,
        subject: 'Lizter account reset link',
        template: 'password-reset',
        context: {
            name: user.firstName,
            code: user.passwordResetCode.code,
            url: frontendUrl,
        },
    });
}
