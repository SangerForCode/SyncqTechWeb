const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "applicants.json");

// Ensure data directory and file exist
const initDB = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
  }
};

// Safe read
const getApplicants = () => {
  initDB();
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading applicants database:", error);
    return [];
  }
};

// Safe write
const saveApplicants = (applicants) => {
  initDB();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(applicants, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing to applicants database:", error);
    return false;
  }
};

// Add new applicant
const addApplicant = (applicant) => {
  const applicants = getApplicants();
  const newApplicant = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...applicant,
    status: "applied", // Initial state
    createdAt: new Date().toISOString()
  };
  applicants.push(newApplicant);
  saveApplicants(applicants);
  return newApplicant;
};

// Update status
const updateApplicantStatus = (id, status) => {
  const applicants = getApplicants();
  const index = applicants.findIndex(app => app.id === id);
  if (index === -1) return null;

  applicants[index].status = status;
  applicants[index].updatedAt = new Date().toISOString();
  saveApplicants(applicants);
  return applicants[index];
};

module.exports = {
  getApplicants,
  addApplicant,
  updateApplicantStatus
};
