import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config/env';
import multer from 'multer';
import { Request } from 'express';

// 1. Sanidi Cloudinary kwa kutumia vigezo vya siri
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

// 2. Sanidi Multer kutumia Memory Storage (Kuhifadhi faili kwenye RAM ya muda kabla ya kwenda wingu)
const storage = multer.memoryStorage();

// Kichujio cha kuhakikisha ni aina gani ya mafaili yanayoruhusiwa
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (
    file.mimetype.startsWith('image/') || 
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Aina hii ya faili hairuhusiwi! Tafadhali pakia picha, video au waraka wa PDF pekee.'));
  }
};

// 3. Unda Multer Middleware kwa ajili ya kupokea faili moja au zaidi kwenye API
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Upeo wa ukubwa wa faili ni MB 10
  },
  fileFilter: fileFilter,
});

/**
 * Mbinu ya kupandisha faili kupitia Buffer (Inayotoka moja kwa moja kwenye Multer) kwenda Cloudinary
 * @param fileBuffer - Buffer ya faili kutoka req.file.buffer
 * @param folder - Jina la folda kwenye Cloudinary (Mfano: 'backend-api/avatars')
 * @param resourceType - Aina ya rasilimali ('image', 'video', 'raw', 'auto')
 */
export const uploadBufferToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'backend-api/uploads',
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }], // Huboresha ukubwa na ubora wa faili kiotomatiki
      },
      (error, result) => {
        if (error) {
          return reject(new Error(`Imeshindwa kupakia faili kwenye Cloudinary: ${error.message}`));
        }
        if (!result) {
          return reject(new Error('Hakuna jibu lililorudishwa na seva ya Cloudinary'));
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Mbinu ya zamani ya kupandisha faili kupitia Base64 string au URL
 * @param fileStr - Data ya Base64 string
 * @param folder - Jina la folda kwenye Cloudinary
 */
export const uploadToCloudinary = async (fileStr: string, folder: string = 'backend-api/uploads') => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: folder,
      resource_type: 'auto',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    return {
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error.message);
    throw new Error(`Imeshindwa kupakia faili kwenye wingu: ${error.message}`);
  }
};

/**
 * Mbinu ya kufuta faili kwenye Cloudinary endapo litabadilishwa au kufutwa na mtumiaji
 * @param publicId - Kitambulisho cha kipekee cha faili kwenye Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: true,
      result,
    };
  } catch (error: any) {
    console.error('Cloudinary Delete Error:', error.message);
    throw new Error(`Imeshindwa kufuta faili kwenye wingu: ${error.message}`);
  }
};

export default cloudinary;
