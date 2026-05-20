const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.MY_AWS_region,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY,
    secretAccessKey: process.env.MY_AWS_SECRET_KEY,
  },
});

module.exports = s3;
