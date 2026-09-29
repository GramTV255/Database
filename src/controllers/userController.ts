import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import User from '../models/User';

// @desc    Pata orodha ya watumiaji wote (Admin pekee)
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kupata orodha ya watumiaji',
      error: error.message,
    });
  }
};

// @desc    Futa mtumiaji kwenye mfumo (Admin pekee)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Mtumiaji hapatikani kwenye mfumo',
      });
      return;
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Mtumiaji amefutwa kwa mafanikio',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Imeshindwa kumfuta mtumiaji',
      error: error.message,
    });
  }
};
