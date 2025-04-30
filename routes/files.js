const express = require('express');
const multer = require('multer');
const { s3 } = require('../lib/s3Client');
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multerS3 = require('multer-s3');
const { z } = require('zod');
const { generateUploadUrl, generateReadUrl } = require('../helpers/filesHelpers');


// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();


// Auto upload image from here, middleware
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB gaurdrail
});


// OLD, UPLOAD USING SERVER AS MIDDLEWARE
// POST 'api/files/upload'
// router.post('/upload', upload.single('image'), (req, res) => {
//   res.json({ url: req.file.location, key: req.file.key });
// });


// TO GET UPLOADURL FOR S3 CLIENT SIDE UPLOAD
// POST 'api/files/getPostUrl'
router.post('/getPostUrl', async (req, res) => {
  const filename = z.string().nonempty().parse(req.body.filename);
  const contentType = z.string().nonempty().parse(req.body.contentType || 'application/octet-stream');

  // Create a unique key
  const fileId = `${Date.now()}_${filename}`;

  // generate the put url
  const uploadUrl = await generateUploadUrl(fileId, contentType);

  res.json({ uploadUrl, fileId });
});

// GET A TEMP URL FOR THE IMAGE
// GET 'api/files/:imageKey'
router.get('/:imageKey', async (req, res) => {
  const url = await generateReadUrl(req.params.imageKey);
  res.json({ url: url });
});

module.exports = router;