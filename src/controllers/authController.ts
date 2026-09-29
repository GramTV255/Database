import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import User, { IUser } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

// 1. Mbinu ya Kusafirisha Tokeni na Cookie kwa Usalama
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // Siku 30
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Inakuwa true kwenye HTTPS (Production)
    sameSite: 'strict' as const,
  };

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
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
    const { name, email, password, role, avatar } = req.body;

    // Kagua kama email ipo tayari
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Barua pepe hii tayari inatumika na akaunti nyingine kwenye mfumo',
      });
      return;
    }

    // Unda mtumiaji mpya
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      avatar: avatar || '',
    });

    sendTokenResponse(user, 201, res);
  } catch (error: any) {
    console.error('Register Controller Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Kosa limetokea wakati wa kusajili mtumiaji',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Kuingia kwenye mfumo (Login User)
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Tafadhali jaza barua pepe na neno la siri',
      });
      return;
    }

    // Tafuta mtumiaji na uhakikishe tunavuta na password (kwa sababu kwenye Schema ina select: false)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Taarifa za kuingia si sahihi (Invalid Credentials)',
      });
      return;
    }

    // Linganisha neno la siri
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Taarifa za kuingia si sahihi (Invalid Credentials)',
      });
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    console.error('Login Controller Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Kosa limetokea wakati wa kuingia kwenye mfumo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Kutoka kwenye mfumo (Logout / Clear Cookie)
// @route   GET /api/v1/auth/logout
// @access  Private
export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000), // Inaisha ndani ya sekunde 5
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Umetoka kwenye mfumo kwa mafanikio makubwa',
  });
};

// @desc    Kupata taarifa za mtumiaji aliyeingia kwa sasa (Get Current Logged-in User Profile)
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kupata taarifa za mtumiaji',
      error: error.message,
    });
  }
};

// @desc    Sasisha taarifa za mtumiaji (Update Details: Name, Email, Avatar)
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
export const updateDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fieldsToUpdate: { name?: string; email?: string; avatar?: string } = {};
    
    if (req.body.name) fieldsToUpdate.name = req.body.name;
    if (req.body.email) fieldsToUpdate.email = req.body.email;
    if (req.body.avatar) fieldsToUpdate.avatar = req.body.avatar;

    const user = await User.findByIdAndUpdate(req.user?._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Taarifa za akaunti zimeboreshwa kikamilifu',
      data: user,
    });
  } catch (error: any) {
    console.error('Update Details Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kuboresha taarifa za akaunti',
      error: error.message,
    });
  }
};

// @desc    Kubadilisha neno la siri (Update Password)
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
export const updatePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ 
        success: false, 
        message: 'Tafadhali weka neno la siri la sasa na neno jipya la siri' 
      });
      return;
    }

    const user = await User.findById(req.user?._id).select('+password');

    if (!user || !user.password) {
      res.status(404).json({ success: false, message: 'Mtumiaji hapatikani kwenye mfumo' });
      return;
    }

    // Hakiki kama neno la siri la sasa ni sahihi
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Neno la siri la sasa uliloweka si sahihi' });
      return;
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    console.error('Update Password Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kubadilisha neno la siri',
      error: error.message,
    });
  }
};

// @desc    Kusahau neno la siri (Forgot Password - Generate Reset Token)
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'Hakuna mtumiaji anayehusishwa na barua pepe hii' 
      });
      return;
    }

    // Tengeneza token ya kubadilisha password
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hifadhi token iliyosimbwa kwa sha256 kwenye database pamoja na muda wa kuisha (dakika 10)
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Token ya kubadilisha neno la siri imezalishwa kikamilifu',
      resetToken, // Katika mifumo ya production, hii inatumwa kupitia barua pepe (Email) badala ya kurejeshwa hapa moja kwa moja
    });
  } catch (error: any) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kuchakata ombi la neno la siri',
      error: error.message,
    });
  }
};

// @desc    Kuweka neno jipya la siri kupitia token (Reset Password)
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ 
        success: false, 
        message: 'Token ya kubadilisha neno la siri si sahihi au muda wake umekwisha' 
      });
      return;
    }

    // Weka neno jipya na ufute alama za token
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kuweka neno jipya la siri',
      error: error.message,
    });
  }
};
