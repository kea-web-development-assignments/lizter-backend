import createApp from './index.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import createMailingService from './utils/emailService.js';
import seedDb from './seed-db.js';

if(process.env.NODE_ENV === 'development') {
    dotenv.config({ path: '.env.development' });
}

const mongooseConnection = await mongoose.createConnection(process.env.DB_CONNECTION_STRING).asPromise();
await seedDb(mongooseConnection);

const emailService = await createMailingService({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM_EMAIL,
    frontendUrl: process.env.FRONTEND_URL,
});

const app = await createApp({ mongooseConnection, emailService });

app.listen(8787, async () => {
    console.info('Lizter server is running! http://localhost:8787');
});
