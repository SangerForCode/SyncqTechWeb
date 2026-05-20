const express = require("express");
const path = require("path");
const db = require("../config/db");

const router = express.Router();

// Helper to validate static admin session token
const validateAdminToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  // Simplistic secure validation token
  return token === "syncq-admin-token-2026-auth";
};

// Admin auth middleware
const requireAdminAuth = (req, res, next) => {
  if (!validateAdminToken(req)) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Unauthenticated admin request."
    });
  }
  next();
};

// Login endpoint
router.post("/admin/login", (req, res) => {
  try {
    const { username, password } = req.body;

    const correctUsername = process.env.ADMIN_USERNAME || "admin";
    const correctPassword = process.env.ADMIN_PASSWORD || "syncqevents2026";

    if (username === correctUsername && password === correctPassword) {
      return res.json({
        success: true,
        message: "Authenticated successfully!",
        token: "syncq-admin-token-2026-auth"
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid admin username or password."
      });
    }
  } catch (error) {
    console.error("Admin login failure:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login."
    });
  }
});

// Fetch all applicants
router.get("/admin/applicants", requireAdminAuth, (req, res) => {
  try {
    const applicants = db.getApplicants();
    // Sort by createdAt descending
    const sorted = [...applicants].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return res.json({
      success: true,
      applicants: sorted
    });
  } catch (error) {
    console.error("Fetch applicants failure:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load applicant list."
    });
  }
});

// Update applicant review status
router.post("/admin/applicants/:id/status", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["applied", "shortlisted", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status parameter. Must be one of: ${allowedStatuses.join(", ")}`
      });
    }

    const updatedApplicant = db.updateApplicantStatus(id, status);

    if (!updatedApplicant) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found."
      });
    }

    return res.json({
      success: true,
      message: `Status successfully updated to ${status}`,
      applicant: updatedApplicant
    });

  } catch (error) {
    console.error("Update applicant status failure:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status."
    });
  }
});

// Download candidate resume via authenticated proxy
router.get("/admin/applicants/:id/resume-download", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const applicants = db.getApplicants();
    const applicant = applicants.find(app => app.id === id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found."
      });
    }

    const resumeUrl = applicant.resumeFileUrl;
    if (!resumeUrl) {
      return res.status(404).json({
        success: false,
        message: "Resume file URL is missing for this applicant."
      });
    }

    let parsedResumeUrl;
    try {
      parsedResumeUrl = new URL(resumeUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Resume file URL is invalid."
      });
    }

    let fileName = path.basename(parsedResumeUrl.pathname) || `resume-${id}`;
    fileName = decodeURIComponent(fileName);

    const upstream = await fetch(parsedResumeUrl.toString());
    if (!upstream.ok) {
      return res.status(502).json({
        success: false,
        message: "Unable to fetch resume file from storage."
      });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await upstream.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", fileBuffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(fileBuffer);
  } catch (error) {
    console.error("Resume download failure:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download resume file."
    });
  }
});

module.exports = router;
