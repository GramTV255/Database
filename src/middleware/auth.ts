import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import User, { IUser } from '../models/User';

// Kuongeza mali za ziada kwenye Request ya Express
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// 1. Mbinu Kuu ya Kuhakiki Tokeni (Protect Routes - Advanced Authentication)
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // Angalia kama token ipo kwenye Headers (Bearer) au Cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'Huna ruhusa ya kufikia rasilimali hii, Hakuna token iliyowasilishwa' 
    });
    return;
  }

  try {
    // Hakiki (Verify) token kwa kutumia JWT Secret
    const decoded: any = jwt.verify(token, config.jwtSecret);

    // Tafuta mtumiaji kwenye database kupitia ID iliyopo kwenye token
    const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');

    if (!currentUser) {
      res.status(401).json({ 
        success: false, 
        message: 'Mtumiaji anayemiliki token hii hayupo tena kwenye mfumo' 
      });
      return;
    }

    // Angalia kama mtumiaji alibadilisha neno la siri baada ya token kutolewa
    if ((currentUser as any).passwordChangedAt) {
      const changedTimestamp = parseInt(((currentUser as any).passwordChangedAt.getTime() / 1000).toString(), 10);
      if (decoded.iat < changedTimestamp) {
        res.status(401).json({ 
          success: false, 
          message: 'Umebadilisha neno la siri hivi karibuni! Tafadhali ingia tena (Login again).' 
        });
        return;
      }
    }

    // Weka taarifa za mtumiaji kwenye request (bila neno la siri)
    req.user = await User.findById(decoded.id).select('-password') as IUser;
    next();
  } catch (error: any) {
    console.error('Auth Error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Huna ruhusa, Token si sahihi au muda wake umeisha' 
    });
    return;
  }
};

// 2. Mbinu ya Uthibitisho wa Hiari (Optional Authentication)
export const optionalProtect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded: any = jwt.verify(token, config.jwtSecret);
      req.user = await User.findById(decoded.id).select('-password') as IUser;
    } catch (error) {
      // Token ikiwa mbaya kwenye optional, tunapuuza tu na kuruhusu aendelee kama mgeni
      req.user = undefined;
    }
  }
  next();
};

// 3. Mbinu ya Kusimamia Vyeo (Role-Based Access Control)
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Kosa la Ruhusa: Nafasi (Role) ya '${req.user?.role || 'mgeni'}' haina idhini ya kutumia huduma hii`,
      });
      return;
    }
    next();
  };
};

// 4. Mbinu ya Kulinda kwa API Key (Kwa ajili ya Apps au Server-to-Server communication)
export const apiKeyProtect = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const systemApiKey = process.env.SYSTEM_API_KEY || 'backend_api_secure_key_2026';

  if (!apiKey || apiKey !== systemApiKey) {
    res.status(403).json({
      success: false,
      message: 'Ufikiaji umekataliwa: API Key si sahihi au haikuwasilishwa',
    });
    return;
  }
  next();
};
