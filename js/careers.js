// ── API INTEGRATION CONFIGURATION ──
// Placeholders are configured here so that connecting to your backend is as simple as replacing the URLs.
const API_CONFIG = {
  RESUME_UPLOAD_ENDPOINT: "https://job-application-backend-o83r.onrender.com/api/careers/upload-resume",
  GOOGLE_SHEETS_ENDPOINT: "https://script.google.com/macros/s/AKfycbxza_Bsy3OsdWi1H-Dh4tEWdTiHA16LQOaLUH9wzF6EXmkiivwkpetXkf7fQsjOXhuTFg/exec?as=1231",
  MOCK_MODE: false
};

// Global application state
const applicationState = {
  skills: [],
  resumeFile: null,
  resumeUrl: "",
  isUploadingResume: false,
  isSubmittingForm: false
};

// Initialize Lucide icons
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
  setupSkillsTags();
  setupResumeUpload();
  setupFormValidation();
});


// ── Prefill Role Dropdown and Scroll ──
function prefillRole(roleName) {
  const select = document.getElementById('role-applying');
  if (select) {
    select.value = roleName;
    // Trigger style check or validation check
    const errorEl = document.getElementById('error-role-applying');
    if (errorEl) errorEl.classList.add('hidden');
    select.classList.remove('border-terra', 'ring-terra/30');
  }

  const formSection = document.getElementById('apply-form-section');
  if (formSection) {
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  showToast(`Selected position: ${roleName}`);
}

// ── Interactive Skills Tag System ──
const setupSkillsTags = () => {
  const container = document.getElementById('skills-tags-container');
  const input = document.getElementById('skill-input');
  const errorEl = document.getElementById('error-skills');

  const renderTags = () => {
    container.innerHTML = "";
    applicationState.skills.forEach((skill, index) => {
      const tag = document.createElement('span');
      tag.className = "inline-flex items-center gap-1.5 text-xs bg-gold/15 text-gold-dark font-medium px-3 py-1.5 rounded-full border border-gold/20";
      tag.innerHTML = `
        <span>${skill}</span>
        <button type="button" class="hover:text-terra font-bold outline-none" onclick="removeSkill(${index})">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      `;
      container.appendChild(tag);
    });

    // Error message is not needed since skills are optional
    errorEl.classList.add('hidden');
  };

  const addSkill = (val) => {
    const clean = val.trim();
    if (clean === "") return;

    // Check duplicate
    if (applicationState.skills.some(s => s.toLowerCase() === clean.toLowerCase())) {
      showToast("Skill is already added!", "warning");
      return;
    }

    applicationState.skills.push(clean);
    renderTags();
    input.value = "";
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(input.value);
    } else if (e.key === ',' || e.key === 'Tab') {
      if (input.value.trim() !== "") {
        e.preventDefault();
        addSkill(input.value);
      }
    }
  });

  // Also support lose focus tag addition
  input.addEventListener('blur', () => {
    addSkill(input.value);
  });

  window.removeSkill = (index) => {
    applicationState.skills.splice(index, 1);
    renderTags();
  };

  window.addQuickSkill = (skill) => {
    addSkill(skill);
  };
};

// ── Resume Drag and Drop + Upload UI ──
const setupResumeUpload = () => {
  const dropZone = document.getElementById('drop-zone');
  const input = document.getElementById('resume-input');
  const emptyState = document.getElementById('upload-state-empty');
  const loadingState = document.getElementById('upload-state-loading');
  const doneState = document.getElementById('upload-state-done');
  const filenameText = document.getElementById('uploaded-filename');
  const filesizeText = document.getElementById('uploaded-filesize');
  const removeBtn = document.getElementById('remove-resume-btn');
  const progressBar = document.getElementById('upload-progress-bar');
  const loadingText = document.getElementById('upload-loading-text');
  const errorEl = document.getElementById('error-resume');
  let loadingMessageInterval = null;
  const loadingMessages = [
    'Uploading resume. Please wait...',
    'SyncQ Tech is securely transferring your document...',
    'SyncQ Tech is validating your file format...',
    'Preparing your candidate profile for review...',
    'Optimizing your application for the hiring team...',
    'Connecting your resume with SyncQ Tech records...',
    'Final checks in progress. Please stay with us...',
    'Almost there, wrapping up your resume upload...'
  ];

  // Click to open file explorer
  dropZone.addEventListener('click', (e) => {
    // Prevent click trigger if delete button is hit
    if (removeBtn.contains(e.target) || e.target === removeBtn) {
      return;
    }
    input.click();
  });

  // Handle drag states
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('border-gold', 'bg-gold/5');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-gold', 'bg-gold/5');
    }, false);
  });

  // Handle drop
  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  });

  // File input selection
  input.addEventListener('change', () => {
    if (input.files && input.files.length > 0) {
      handleFile(input.files[0]);
    }
  });

  // File verification & uploading simulator
  const handleFile = (file) => {
    errorEl.classList.add('hidden');
    dropZone.classList.remove('border-terra', 'bg-terra/5');

    // Validation 1: Allowed Types (PDF and DOCX)
    const allowedExtensions = /(\.pdf|\.docx)$/i;
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.exec(fileExt)) {
      showInputValidationError(errorEl, "Invalid file format. Please upload only PDF or DOCX files.");
      dropZone.classList.add('border-terra', 'bg-terra/5');
      return;
    }

    // Validation 2: File Size Max 5MB (5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showInputValidationError(errorEl, `File is too large (${(file.size / (1024*1024)).toFixed(2)}MB). Max size permitted is 5MB.`);
      dropZone.classList.add('border-terra', 'bg-terra/5');
      return;
    }

    applicationState.resumeFile = file;
    uploadResume(file);
  };

  // Simulated / Actual Upload
  const uploadResume = async (file) => {
    applicationState.isUploadingResume = true;

    const startUploadAnimation = () => {
      if (loadingMessageInterval) {
        clearInterval(loadingMessageInterval);
      }

      let messageIndex = 0;
      loadingText.textContent = loadingMessages[messageIndex];
      progressBar.classList.add('upload-progress-indeterminate');

      loadingMessageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        loadingText.textContent = loadingMessages[messageIndex];
      }, 1200);
    };

    const stopUploadAnimation = () => {
      if (loadingMessageInterval) {
        clearInterval(loadingMessageInterval);
        loadingMessageInterval = null;
      }
      progressBar.classList.remove('upload-progress-indeterminate');
    };

    // UI Transitions
    emptyState.classList.add('hidden');
    doneState.classList.add('hidden');
    loadingState.classList.remove('hidden');
    progressBar.style.width = "0%";
    startUploadAnimation();

    if (API_CONFIG.MOCK_MODE) {
      setTimeout(() => {
        stopUploadAnimation();
        completeUploadState(file, "https://storage.syncqtech.com/resumes/mock-uploaded-file-" + Date.now() + file.name);
      }, 1600);
    } else {
      // Actual AJAX resume uploading
      try {
        const formData = new FormData();
        formData.append("resume", file);
        formData.append("applicantName", document.getElementById('full-name').value.trim() || "applicant");
        formData.append("role", document.getElementById('role-applying').value || "general");

        const response = await fetch(API_CONFIG.RESUME_UPLOAD_ENDPOINT, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error("Resume upload failed. Server rejected file.");
        }

        const data = await response.json();
        stopUploadAnimation();
        progressBar.style.width = "100%";
        loadingText.textContent = "Complete!";

        completeUploadState(
          file,
          data.resumeUrl || data.fileUrl || data.path || "https://storage.syncqtech.com/resumes/" + file.name,
          data.fileName || file.name
        );
      } catch (error) {
        console.error("Upload error:", error);
        // Revert state
        applicationState.isUploadingResume = false;
        applicationState.resumeFile = null;
        applicationState.resumeUrl = "";
        stopUploadAnimation();

        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        progressBar.style.width = "0%";
        showInputValidationError(errorEl, "Connection error: Could not upload resume. Please try again.");
        showToast("Failed to upload resume. Please check your connection.", "error");
      }
    }
  };

  const completeUploadState = (file, fileUrl, storedFileName) => {
    applicationState.isUploadingResume = false;
    applicationState.resumeUrl = fileUrl;

    // Render Done UI
    loadingState.classList.add('hidden');
    doneState.classList.remove('hidden');
    filenameText.textContent = storedFileName || file.name;
    filesizeText.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    showToast("Resume uploaded successfully!", "success");
    if (window.lucide) window.lucide.createIcons();
  };

  // Remove resume handler
  removeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    applicationState.resumeFile = null;
    applicationState.resumeUrl = "";

    doneState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    input.value = ""; // Clear file selector

    showToast("Resume removed.");
  });
};

// ── Input Validations ──
const showInputValidationError = (element, message) => {
  element.textContent = message;
  element.classList.remove('hidden');
};

const hideInputValidationError = (element) => {
  element.classList.add('hidden');
};

const validateField = (id, validationFn, errorMessage) => {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(`error-${id}`);
  if (!input || !errorEl) return true;

  const isValid = validationFn(input.value.trim());
  if (!isValid) {
    showInputValidationError(errorEl, errorMessage);
    input.classList.add('border-terra', 'ring-2', 'ring-terra/20');
    input.classList.remove('border-bark/10', 'focus:ring-gold/30', 'focus:border-gold/50');
    return false;
  } else {
    hideInputValidationError(errorEl);
    input.classList.remove('border-terra', 'ring-2', 'ring-terra/20');
    input.classList.add('border-bark/10');
    return true;
  }
};

const setupFormValidation = () => {
  // Add real-time visual clearing of validation border on keystroke
  const fields = ['full-name', 'email', 'phone', 'college', 'degree', 'linkedin', 'github', 'why-join', 'role-applying', 'year-of-study'];
  fields.forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.addEventListener('input', () => {
        el.classList.remove('border-terra', 'ring-2', 'ring-terra/20');
        el.classList.add('border-bark/10');
        const errorEl = document.getElementById(`error-${fieldId}`);
        if (errorEl) errorEl.classList.add('hidden');
      });
      el.addEventListener('change', () => {
        el.classList.remove('border-terra', 'ring-2', 'ring-terra/20');
        el.classList.add('border-bark/10');
        const errorEl = document.getElementById(`error-${fieldId}`);
        if (errorEl) errorEl.classList.add('hidden');
      });
    }
  });
};

// ── Toast Notifications ──
function showToast(message, type = "success") {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast-enter flex items-center gap-3 bg-bark text-ivory text-sm px-5 py-3.5 rounded-xl shadow-xl shadow-bark/20 transition-transform duration-300 max-w-sm border border-white/5';

  let icon = '<i data-lucide="check-circle" class="w-4 h-4 text-tea shrink-0"></i>';
  if (type === "error") {
    icon = '<i data-lucide="alert-circle" class="w-4 h-4 text-terra shrink-0"></i>';
  } else if (type === "warning") {
    icon = '<i data-lucide="alert-triangle" class="w-4 h-4 text-gold shrink-0"></i>';
  }

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);

  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => { 
      toast.classList.remove('toast-enter'); 
      toast.classList.add('toast-show'); 
    });
  });

  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-enter');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

const submitApplicationToSheets = async (sheetData) => {
  await fetch(API_CONFIG.GOOGLE_SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sheetData)
  });
};

// ── Application Form Submission ──
const form = document.getElementById('careers-apply-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (applicationState.isSubmittingForm || applicationState.isUploadingResume) {
    showToast("Please wait for operations to complete.", "warning");
    return;
  }

  // ── Step 1: Run Thorough Field Validations ──
  let isFormValid = true;

  // Validate Full Name
  isFormValid = validateField('full-name', 
    val => val === "" || val.length >= 2, 
    "Full Name must be at least 2 characters long."
  ) && isFormValid;

  // Validate Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  isFormValid = validateField('email', 
    val => val === "" || emailRegex.test(val), 
    "Please enter a valid email address."
  ) && isFormValid;

  // Validate Phone (10 digits minimum)
  const phoneRegex = /^\d{8,14}$/;
  isFormValid = validateField('phone', 
    val => val === "" || phoneRegex.test(val), 
    "Please enter a valid phone number (8 to 14 digits, numbers only)."
  ) && isFormValid;

  // Validate College
  isFormValid = validateField('college', 
    val => val === "" || val.length >= 3, 
    "Please specify your college or university name."
  ) && isFormValid;

  // Validate Study Year dropdown
  // Year of study is optional for now
  isFormValid = validateField('year-of-study', 
    val => true, 
    ""
  ) && isFormValid;

  // Validate Degree
  isFormValid = validateField('degree', 
    val => val === "" || val.length >= 2, 
    "Please specify your degree and specialization."
  ) && isFormValid;

  // Validate LinkedIn
  const urlRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i;
  isFormValid = validateField('linkedin', 
    val => val === "" || urlRegex.test(val), 
    "Please enter a valid LinkedIn profile link (e.g. linkedin.com/in/...)"
  ) && isFormValid;

  // Validate GitHub/Portfolio (Optional)
  isFormValid = validateField('github', 
    val => val === "" || val.startsWith('http://') || val.startsWith('https://') || val.length >= 4, 
    "Please enter a valid URL or link to your portfolio/github."
  ) && isFormValid;

  // Role selection is optional for now
  isFormValid = validateField('role-applying', 
    val => true, 
    ""
  ) && isFormValid;

  // Skills are optional now
  const skillsErrorEl = document.getElementById('error-skills');
  if (skillsErrorEl) {
    hideInputValidationError(skillsErrorEl);
  }

  // Validate Why Join (Minimum 50 chars) — optional for now
  isFormValid = validateField('why-join', 
    val => val === "" || val.length >= 50, 
    "Please share your thoughts in detail (minimum 50 characters)."
  ) && isFormValid;

  // Resume is optional for now
  const resumeErrorEl = document.getElementById('error-resume');
  const dropZone = document.getElementById('drop-zone');
  if (!applicationState.resumeUrl) {
    // hide any resume error and do not block submission
    hideInputValidationError(resumeErrorEl);
    dropZone.classList.remove('border-terra', 'bg-terra/5');
  } else {
    hideInputValidationError(resumeErrorEl);
  }

  // Exit early if form is invalid, trigger subtle shake animation on container
  if (!isFormValid) {
    const formCard = document.getElementById('application-form-container');
    formCard.classList.add('animate-shake');
    setTimeout(() => formCard.classList.remove('animate-shake'), 400);
    showToast("Please fix the validation errors in the form.", "error");
    return;
  }

  // ── Step 2: Form submission ──
  submitApplication();
});

const submitApplication = async () => {
  const submitBtn = document.getElementById('submit-btn');
  const defaultButtonHTML = submitBtn.innerHTML;

  applicationState.isSubmittingForm = true;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 animate-spin shrink-0"></i> Submitting Application...';
  if (window.lucide) window.lucide.createIcons();

  const applicantPayload = {
    fullName: document.getElementById('full-name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phoneCountryCode: document.getElementById('country-code').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    college: document.getElementById('college').value.trim(),
    yearOfStudy: document.getElementById('year-of-study').value,
    degree: document.getElementById('degree').value.trim(),
    linkedinUrl: document.getElementById('linkedin').value.trim(),
    portfolioUrl: document.getElementById('github').value.trim(),
    role: document.getElementById('role-applying').value,
    skills: applicationState.skills,
    whyJoin: document.getElementById('why-join').value.trim(),
    resumeFileUrl: applicationState.resumeUrl
  };

  const sheetPayload = {
    fullName: applicantPayload.fullName,
    email: applicantPayload.email,
    phone: `${applicantPayload.phoneCountryCode} ${applicantPayload.phone}`.trim(),
    college: applicantPayload.college,
    year: applicantPayload.yearOfStudy,
    degree: applicantPayload.degree,
    linkedin: applicantPayload.linkedinUrl,
    portfolio: applicantPayload.portfolioUrl,
    role: applicantPayload.role,
    skills: applicantPayload.skills,
    whyJoin: applicantPayload.whyJoin,
    resumeUrl: applicantPayload.resumeFileUrl
  };

  if (API_CONFIG.MOCK_MODE) {
    // Mock network delay (1.5 seconds)
    setTimeout(() => {
      showToast("Application submitted successfully!", "success");

      // Switch UI layout to success confirmation state
      document.getElementById('application-form-container').classList.add('hidden');
      const successState = document.getElementById('success-confirmation');
      successState.classList.remove('hidden');
      successState.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Reset button state
      applicationState.isSubmittingForm = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = defaultButtonHTML;
      if (window.lucide) window.lucide.createIcons();
    }, 1500);
  } else {
    // Submit application metadata to Google Sheets after the resume upload succeeds.
    try {
      await submitApplicationToSheets(sheetPayload);

      showToast("Application submitted successfully!", "success");

      // Switch UI to success confirmation state
      document.getElementById('application-form-container').classList.add('hidden');
      const successState = document.getElementById('success-confirmation');
      successState.classList.remove('hidden');
      successState.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (error) {
      console.error("Submission error:", error);
      showToast("Submission failed. Server rejected application. Please try again later.", "error");
    } finally {
      applicationState.isSubmittingForm = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = defaultButtonHTML;
      if (window.lucide) window.lucide.createIcons();
    }
  }
};

// Reset page to allow multiple submissions
window.resetApplicationForm = () => {
  form.reset();

  // Clear skills state
  applicationState.skills = [];
  document.getElementById('skills-tags-container').innerHTML = "";

  // Clear file upload state
  applicationState.resumeFile = null;
  applicationState.resumeUrl = "";
  document.getElementById('resume-input').value = "";
  document.getElementById('upload-state-done').classList.add('hidden');
  document.getElementById('upload-state-empty').classList.remove('hidden');

  // Swap viewports back
  document.getElementById('success-confirmation').classList.add('hidden');
  document.getElementById('application-form-container').classList.remove('hidden');

  const formSection = document.getElementById('apply-form-section');
  if (formSection) {
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  showToast("Form reset. Ready for new submission.");
};

// Helper: standard smooth scroll for anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


// Role card 3D tilt
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.bento-role-card').forEach(card => {
    card.style.transition = 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease';
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      card.style.transform = `perspective(800px) rotateY(${(dx * 3).toFixed(2)}deg) rotateX(${(dy * -3).toFixed(2)}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0px)';
    });
  });
}
