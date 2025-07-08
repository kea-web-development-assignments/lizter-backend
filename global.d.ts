import 'express';
import { InferSchemaType, HydratedDocument } from 'mongoose';
import userModel from './models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<InferSchemaType<ReturnType<typeof userModel>['schema']>>;
    }
  }
}
