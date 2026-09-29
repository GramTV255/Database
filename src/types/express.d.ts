import { Document } from 'mongoose';

// Kufafanua muundo wa Mtumiaji kwenye Request ya Express
declare global {
  namespace Express {
    interface Request {
      user?: Document & {
        _id: any;
        name: string;
        email: string;
        role: string;
        isVerified: boolean;
      };
    }
  }
}
