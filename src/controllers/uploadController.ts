import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/fileUpload';
import User from '../models/User';

// @desc    Kupakia Picha ya Wasifu (Upload User Avatar)
// @route   POST /api/v1/upload/avatar
// @access  Private
export const uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Angalia kama faili limewasilishwa kupitia Multer
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Tafadhali chagua faili la picha ili kupakia',
      });
      return;
    }

    // Pandisha faili kwenda Cloudinary kupitia Buffer
    const uploadResult = await uploadBufferToCloudinary(
      req.file.buffer,
      'backend-api/avatars',
      'image'
    );

    // Sasisha taarifa za mtumiaji kwenye database na URL mpya ya avatar
    const userId = req.user?._id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: uploadResult.secure_url },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Picha ya wasifu imepakiwa na kuboreshwa kwa mafanikio!',
      data: {
        avatarUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        user: updatedUser,
      },
    });
  } catch (error: any) {
    console.error('Upload Avatar Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kupakia picha kwenye seva',
      error: error.message,
    });
  }
};

// @desc    Kupakia faili la jumla (General File Upload)
// @route   POST /api/v1/upload/file
// @access  Private
export const uploadGeneralFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Tafadhali wasilisha faili',
      });
      return;
    }

    const uploadResult = await uploadBufferToCloudinary(
      req.file.buffer,
      'backend-api/general',
      'auto'
    );

    res.status(200).json({
      success: true,
      message: 'Faili limepakiwa kwenye wingu kwa mafanikio!',
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes,
      },
    });
  } catch (error: any) {
    console.error('General Upload Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kupakia faili',
      error: error.message,
    });
  }
};

