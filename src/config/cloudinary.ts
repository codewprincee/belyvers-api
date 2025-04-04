import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    cloud_name: 'de9tyduvf',
    api_key: '273561781969793',
    api_secret: 'txHPrWwfKX2IPQnjFRgctgB3TOc'
});

// @ts-ignore

const storage = new CloudinaryStorage({

    cloudinary: cloudinary,
    params: {
        // @ts-ignore
        folder: 'storage',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        resource_type: 'auto'
    }

});

export const upload = multer({ storage: storage });
export default cloudinary; 