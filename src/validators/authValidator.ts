import { Request, Response, NextFunction } from 'express';

// 1. Uhakiki wa Usajili (Register Validation)
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password } = req.body;

  const errors: string[] = [];

  if (!name || name.trim().length < 2) {
    errors.push('Jina linatakiwa kuwa na angalau herufi 2');
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    errors.push('Tafadhali weka barua pepe (email) halisi na iliyo sahihi');
  }

  if (!password || password.length < 6) {
    errors.push('Neno la siri (password) linatakiwa kuwa na angalau herufi 6');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Kosa la Uhakiki wa Taarifa (Validation Error)',
      errors,
    });
    return;
  }

  next();
};

// 2. Uhakiki wa Kuingia (Login Validation)
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  const errors: string[] = [];

  if (!email || !email.includes('@')) {
    errors.push('Tafadhali weka barua pepe sahihi');
  }

  if (!password) {
    errors.push('Tafadhali weka neno la siri');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Kosa la Uhakiki wa Taarifa (Validation Error)',
      errors,
    });
    return;
  }

  next();
};
