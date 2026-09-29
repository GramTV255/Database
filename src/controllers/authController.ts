import { Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

// Chombo cha kusaidia kutuma jibu lenye Token na Cookie
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
  // Tengeneza JWT Token kutoka kwenye model ya User
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // Siku 30
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Inakuwa true kama ipo kwenye production (HTTPS)
  };

  // Ondoa password kwenye data zinazotoka kwenda kwa mteja
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: userResponse,
    });
};

// @desc    Kujisajili kwa mtumiaji mpya (Register User)
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Angalia kama barua pepe tayari inatumika
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Barua pepe hii tayari imesajiliwa kwenye mfumo',
      });
      return;
    }

    // Unda mtumiaji mpya (Neno la siri litasimbwa kiotomatiki na Pre-save hook kwenye Model)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });

    sendTokenResponse(user, 201, res);
  } catch (error: any) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Kosa limetokea kwenye seva wakati wa kusajili',
      error: error.message,
    });
  }
};

// @desc    Kuingia kwenye mfumo (Login User)
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Hakikisha email na password vimejazwa
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Tafadhali weka barua pepe na neno la siri',
      });
      return;
    }

    // Tafuta mtumiaji na uhakikishe tunavuta na neno la siri (kwa sababu kwenye Schema nimeweka select: false)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Taarifa za kuingia si sahihi (Credentials Invalid)',
      });
      return;
    }

    // Linganisha neno la siri lililoandikwa na lile lililosimbwa kwenye database
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Taarifa za kuingia si sahihi (Credentials Invalid)',
      });
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Kosa limetokea kwenye seva wakati wa kuingia',
      error: error.message,
    });
  }
};

// @desc    Kupata taarifa za mtumiaji aliyeingia kwa sasa (Get Current Logged-in User)
// @route   GET /api/v1/auth/me
// @access  Private (Inahitaji Token)
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // req.user inaletwa na 'protect' middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('GetMe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kupata taarifa za mtumiaji',
      error: error.message,
    });
  }
};
