import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/fileUpload';
import User from '../models/User';

// @desc    Kupakia Picha ya Wasifu (Upload User Avatar)
// @route   POST /api/v1/upload/avatar
// @access  Private
export const uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Tafadhali chagua faili la picha ili kupakia',
      });
      return;
    }

    // Pandisha faili kwenda Cloudinary kwenye folda ya avatars
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

// @desc    Kupakia faili moja la kawaida (General Single File Upload)
// @route   POST /api/v1/upload/single
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

// @desc    Kupakia mafaili mengi kwa mara moja (Multiple Files Upload)
// @route   POST /api/v1/upload/multiple
// @access  Private
export const uploadMultipleFiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // req.files inabeba array ya mafaili kupitia Multer (upload.array)
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Tafadhali chagua angalau faili moja au zaidi ya kupakia',
      });
      return;
    }

    // Tumia Promise.all kupandisha mafaili yote kwa wakati mmoja kwa kasi kubwa
    const uploadPromises = files.map((file) =>
      uploadBufferToCloudinary(file.buffer, 'backend-api/gallery', 'auto')
    );

    const uploadResults = await Promise.all(uploadPromises);

    // Kusanya matokeo ya mafaili yaliyopakiwa
    const formattedResults = uploadResults.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    }));

    res.status(200).json({
      success: true,
      count: formattedResults.length,
      message: 'Mafaili yote yamepakiwa kwenye wingu kwa mafanikio!',
      data: formattedResults,
    });
  } catch (error: any) {
    console.error('Multiple Upload Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kupakia mafaili mengi kwa pamoja',
      error: error.message,
    });
  }
};

// @desc    Kufuta faili kwenye wingu la Cloudinary (Delete Cloud File)
// @route   DELETE /api/v1/upload/file/:publicId
// @access  Private (Admin au Moderator pekee)
export const deleteCloudFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      res.status(400).json({
        success: false,
        message: 'Tafadhali toa kitambulisho cha faili (Public ID)',
      });
      return;
    }

    // Kwa kuwa publicId inaweza kuwa na alama za slash (/), tunahakikisha inasomwa vizuri kama ilivyo au encoded
    const decodedPublicId = decodeURIComponent(publicId);

    const result = await deleteFromCloudinary(decodedPublicId);

    res.status(200).json({
      success: true,
      message: 'Faili limefutwa kwenye wingu kwa mafanikio!',
      data: result,
    });
  } catch (error: any) {
    console.error('Delete Cloud File Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kufuta faili kwenye wingu',
      error: error.message,
    });
  }
};
