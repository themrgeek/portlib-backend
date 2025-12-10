const Joi = require("joi");
const { VALIDATION } = require("./constants");

class Validators {
  // Signup validation schema
  static signupSchema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    phone: Joi.string().pattern(VALIDATION.PHONE_REGEX).required().messages({
      "string.pattern.base":
        "Please provide a valid phone number with country code",
      "any.required": "Phone number is required",
    }),
    password: Joi.string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH)
      .allow("")
      .empty("")
      .optional()
      .messages({
        "string.min": `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`,
      }),
    confirmPassword: Joi.string()
      .allow("")
      .empty("")
      .optional()
      .when("password", {
        is: Joi.string().min(1),
        then: Joi.string().valid(Joi.ref("password")).required().messages({
          "any.only": "Passwords do not match",
          "any.required": "Please confirm your password",
        }),
        otherwise: Joi.optional(),
      }),
    fullName: Joi.string().min(2).max(100).required().messages({
      "string.min": "Full name must be at least 2 characters",
      "string.max": "Full name cannot exceed 100 characters",
      "any.required": "Full name is required",
    }),
    studentId: Joi.string().min(1).max(50).required().messages({
      "string.min": "Student ID must be at least 1 character",
      "string.max": "Student ID cannot exceed 50 characters",
      "any.required": "Student ID is required",
    }),
    department: Joi.string()
      .min(2)
      .max(100)
      .allow("")
      .empty("")
      .optional()
      .messages({
        "string.min": "Department must be at least 2 characters",
        "string.max": "Department cannot exceed 100 characters",
      }),
    yearOfStudy: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .allow(null)
      .optional()
      .messages({
        "number.min": "Year of study must be between 1 and 5",
        "number.max": "Year of study must be between 1 and 5",
      }),
  });

  // Login validation schema
  static loginSchema = Joi.object({
    phone: Joi.string().pattern(VALIDATION.PHONE_REGEX).required().messages({
      "string.pattern.base": "Please provide a valid phone number",
      "any.required": "Phone number is required",
    }),
    password: Joi.string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH)
      .required()
      .messages({
        "string.min": `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
        "any.required": "Password is required",
      }),
  });

  // OTP validation schema
  static otpSchema = Joi.object({
    userId: Joi.string().uuid().required().messages({
      "string.guid": "Invalid user ID format",
      "any.required": "User ID is required",
    }),
    otp: Joi.string()
      .length(VALIDATION.OTP_LENGTH)
      .pattern(/^\d+$/)
      .required()
      .messages({
        "string.length": "OTP must be 6 digits",
        "string.pattern.base": "OTP must contain only digits",
        "any.required": "OTP is required",
      }),
    type: Joi.string()
      .valid("signup", "login", "password_reset")
      .default("login"),
  });

  // Email validation schema
  static emailSchema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  });

  // Password reset schema
  static passwordResetSchema = Joi.object({
    token: Joi.string().length(VALIDATION.TOKEN_LENGTH).required().messages({
      "string.length": "Invalid token format",
      "any.required": "Token is required",
    }),
    newPassword: Joi.string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH)
      .required()
      .messages({
        "string.min": `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
        "any.required": "New password is required",
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "any.required": "Please confirm your password",
      }),
  });

  // Change password schema
  static changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
    }),
    newPassword: Joi.string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH)
      .required()
      .messages({
        "string.min": `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
        "any.required": "New password is required",
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "any.required": "Please confirm your password",
      }),
  });

  // Resend OTP schema
  static resendOtpSchema = Joi.object({
    userId: Joi.string().uuid().required().messages({
      "string.guid": "Invalid user ID format",
      "any.required": "User ID is required",
    }),
    type: Joi.string()
      .valid("signup", "login", "password_reset")
      .default("signup"),
  });

  // Staff (admin/librarian) creation schema
  static staffSignupSchema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    phone: Joi.string().pattern(VALIDATION.PHONE_REGEX).required().messages({
      "string.pattern.base":
        "Please provide a valid phone number with country code",
      "any.required": "Phone number is required",
    }),
    password: Joi.string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH)
      .required()
      .messages({
        "string.min": `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`,
        "any.required": "Password is required",
      }),
    fullName: Joi.string().min(2).max(100).required().messages({
      "string.min": "Full name must be at least 2 characters",
      "string.max": "Full name cannot exceed 100 characters",
      "any.required": "Full name is required",
    }),
    role: Joi.string().valid("librarian", "admin").required().messages({
      "any.only": "Role must be librarian or admin",
      "any.required": "Role is required",
    }),
  });

  // Validate data against schema
  static async validate(data, schema) {
    try {
      const value = await schema.validateAsync(data, {
        abortEarly: false,
        stripUnknown: true,
      });
      return { isValid: true, value, errors: null };
    } catch (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));
      return { isValid: false, value: null, errors };
    }
  }

  // Validate request body
  static async validateRequest(req, schema) {
    return await this.validate(req.body, schema);
  }
}

module.exports = Validators;
