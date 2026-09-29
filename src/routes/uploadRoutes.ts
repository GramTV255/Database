import { Router } from 'express';
import { 
  uploadAvatar, 
  uploadGeneralFile, 
  uploadMultipleFiles, 
  deleteCloudFile 
} from '../controllers/uploadController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../utils/fileUpload';

const router = Router();

// 1. Njia ya Kupakia Picha ya Wasifu (Single Avatar Upload)
// Inapokea faili moja kupitia kitufe cha 'image' na kusasisha wasifu wa mtumiaji moja kwa moja
router.post('/avatar', protect, upload.single('image'), uploadAvatar);

// 2. Njia ya Kupakia Faili Moja la Kawaida (General Single File Upload)
// Inapokea faili lolote kupitia kitufe cha 'file' (Picha, Video, au PDF)
router.post('/single', protect, upload.single('file'), uploadGeneralFile);

// 3. Njia ya Kupakia Mafaili Mengi kwa Wakati Mmoja (Multiple Files Upload)
// Inaruhusu kupakia hadi mafaili 5 kwa mpigo kupitia kitufe cha 'files'
router.post('/multiple', protect, upload.array('files', 5), uploadMultipleFiles);

// 4. Njia ya Kufuta Faili kwenye Wingu (Cloudinary File Deletion)
// Inahitaji mtumiaji awe ameingia na awe na mamlaka ya 'admin' au 'moderator'
router.delete('/file/:publicId', protect, authorize('admin', 'moderator'), deleteCloudFile);

export default router;
