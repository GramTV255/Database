import { Router } from 'express';
import { 
  register, 
  login, 
  logout,
  getMe, 
  updateDetails, 
  updatePassword, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController';
import { protect, authorize, apiKeyProtect } from '../middleware/auth';

const router = Router();

// 1. Njia za Wazi (Public Endpoints - Hazihitaji Token)
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// 2. Njia Zinazohitaji Ulinzi wa Token (Protected Endpoints - Logged-in Users)
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// 3. Njia Maalum Zinazohitaji API Key ya Ziada (Mfumo wa Nje au Apps Maalum)
router.get('/secure-ping', apiKeyProtect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ufikiaji wa API Key umethibitishwa kikamilifu!',
    timestamp: new Date().toISOString()
  });
});

export default router;
