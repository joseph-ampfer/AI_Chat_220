const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../lib/s3Client");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


// Get a signed url from S3
async function generateReadUrl(fileId) {
  const cmd = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileId
  });
  // Valid for 5 minutes
  return await getSignedUrl(s3, cmd, { expiresIn: 300 });
};

// Get a PUT url to for client to upload to S3
async function generateUploadUrl(fileId, contentType) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileId,
    ContentType: contentType
  });
  // URL valid for 5 minutes
  return await getSignedUrl(s3, cmd, { expiresIn: 300 });
};

module.exports = { generateReadUrl, generateUploadUrl };