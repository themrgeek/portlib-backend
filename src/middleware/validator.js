const Validators = require("../utils/validators");

const validatorMiddleware = {
  validateSignup: async (req, res, next) => {
    console.log("[validateSignup] Request body:", JSON.stringify(req.body));
    const validation = await Validators.validateRequest(
      req,
      Validators.signupSchema
    );
    if (!validation.isValid) {
      console.log(
        "[validateSignup] Validation errors:",
        JSON.stringify(validation.errors, null, 2)
      );
      return res.status(400).json({
        success: false,
        error: "validation_error",
        message: "Validation failed",
        errors: validation.errors,
      });
    }
    req.validatedData = validation.value;
    next();
  },

  validateLogin: async (req, res, next) => {
    const validation = await Validators.validateRequest(
      req,
      Validators.loginSchema
    );
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "validation_error",
        message: "Validation failed",
        errors: validation.errors,
      });
    }
    req.validatedData = validation.value;
    next();
  },

  validateOTP: async (req, res, next) => {
    const validation = await Validators.validateRequest(
      req,
      Validators.otpSchema
    );
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "validation_error",
        message: "Validation failed",
        errors: validation.errors,
      });
    }
    req.validatedData = validation.value;
    next();
  },

  validateEmail: async (req, res, next) => {
    const validation = await Validators.validateRequest(
      req,
      Validators.emailSchema
    );
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "validation_error",
        message: "Validation failed",
        errors: validation.errors,
      });
    }
    req.validatedData = validation.value;
    next();
  },

  validatePasswordReset: async (req, res, next) => {
    const validation = await Validators.validateRequest(
      req,
      Validators.passwordResetSchema
    );
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "validation_error",
        message: "Validation failed",
        errors: validation.errors,
      });
    }
    req.validatedData = validation.value;
    next();
  },

  validateChangePassword: async (req, res, next) => {
    const validation = await Validators.validateRequest(
      req,
      Validators.changePasswordSchema
    );
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "validation_error",
        message: "Validation failed",
        errors: validation.errors,
      });
    }
    req.validatedData = validation.value;
    next();
  },

  validateResendOTP: async (req, res, next) => {
    const validation = await Validators.validateRequest(
      req,
      Validators.resendOtpSchema
    );
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "validation_error",
        message: "Validation failed",
        errors: validation.errors,
      });
    }
    req.validatedData = validation.value;
    next();
  },

  validateStaffSignup: async (req, res, next) => {
    const validation = await Validators.validateRequest(
      req,
      Validators.staffSignupSchema
    );
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "validation_error",
        message: "Validation failed",
        errors: validation.errors,
      });
    }
    req.validatedData = validation.value;
    next();
  },
};

module.exports = validatorMiddleware;
