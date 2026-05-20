const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = require("../config/s3");
const db = require("../config/db");

const router = express.Router();

const roleFolderMap = {
  "sales & marketing": "sales",
  "sales and marketing": "sales",
  "product strategy": "social-media",
  "legal intern": "legal",
  "ui/ux": "ui-ux",
  "ui ux": "ui-ux",
  "ui/ux designer": "ui-ux",
};

const getRoleFolder = (role) => {
  const normalizedRole = (role || "general")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return roleFolderMap[normalizedRole] || "general";
};

const slugifyFilePart = (value, fallback) => {
  return (value || fallback)
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
};

// Multer in-memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Resume upload endpoint with local S3 fallback
router.post("/careers/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No resume file uploaded.",
      });
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const roleFolder = getRoleFolder(req.body.role);
    const applicantName = slugifyFilePart(req.body.applicantName, "applicant");
    const roleName = slugifyFilePart(req.body.role, "general");
    const uploadDate = new Date().toISOString().slice(0, 10);
    const fileName = `${applicantName}-${roleName}-${uploadDate}-${Date.now()}${fileExtension}`;

    let fileUrl = "";
    let s3Successful = false;

    // 1. Attempt AWS S3 Upload
    try {
      if (process.env.AWS_BUCKET_NAME && process.env.AWS_ACCESS_KEY) {
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `resumes/${roleFolder}/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        await s3.send(new PutObjectCommand(uploadParams));
        fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/resumes/${roleFolder}/${fileName}`;
        s3Successful = true;
        console.log(`[S3] Successfully uploaded resume: ${fileName}`);
      } else {
        console.warn("[S3] AWS configurations not fully setup in .env, using local storage fallback");
      }
    } catch (s3Error) {
      console.warn("[S3] Upload failed, falling back to local file storage:", s3Error.message);
    }

    // 2. Fallback to Local Storage if S3 was not used or failed
    if (!s3Successful) {
      const uploadDir = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const roleUploadDir = path.join(uploadDir, roleFolder);
      if (!fs.existsSync(roleUploadDir)) {
        fs.mkdirSync(roleUploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(roleUploadDir, fileName), file.buffer);
      // Construct local server URL
      const forwardedProto = (req.headers["x-forwarded-proto"] || "").toString().split(",")[0].trim();
      const protocol = forwardedProto || req.protocol || "http";
      const host = (req.headers["x-forwarded-host"] || req.get("host") || "").toString().trim();
      const fallbackHost = `localhost:${process.env.PORT || 5000}`;
      fileUrl = `${protocol}://${host || fallbackHost}/uploads/${roleFolder}/${fileName}`;
      console.log(`[Local] Successfully saved resume locally: ${fileName}`);
    }

    return res.json({
      success: true,
      fileUrl,
      fileName,
      size: file.size
    });

  } catch (error) {
    console.error("Resume upload system failure:", error);
    return res.status(500).json({
      success: false,
      message: "Internal system error occurred while uploading file.",
    });
  }
});

// Careers application details submit endpoint
router.post("/careers/submit", async (req, res) => {
  try {
    const details = req.body;

    // Validate essential fields
    const requiredFields = ["fullName", "email", "phone", "college", "role", "resumeFileUrl"];
    for (const field of requiredFields) {
      if (!details[field] || details[field].toString().trim() === "") {
        return res.status(400).json({
          success: false,
          message: `Required field missing or empty: ${field}`
        });
      }
    }

    // Add applicant to data store
    const newApplicant = db.addApplicant(details);

    return res.json({
      success: true,
      message: "Application submitted successfully!",
      applicant: newApplicant
    });

  } catch (error) {
    console.error("Application form submission failure:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while processing application."
    });
  }
});

module.exports = router;
