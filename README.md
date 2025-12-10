# PortLib Backend

PortLib is an intelligent library management system with OTP authentication, email verification, and comprehensive user management.

## Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **OTP Verification**: Twilio SMS OTP for phone verification
- **Email Verification**: Nodemailer for email verification and notifications
- **Password Reset**: Secure token-based password reset
- **Rate Limiting**: Protection against abuse with multiple rate limiters
- **Role-based Access**: Student, Librarian, and Admin roles
- **Database**: PostgreSQL with Supabase
- **Security**: Helmet, CORS, input validation, password hashing

## Verification flow notes

- After phone OTP verification, the API now returns tokens even if email is still unverified, but responses include `requiresEmailVerification: true` until email is confirmed.
- A short-lived (5-minute) email verification link is sent; if the account is not verified within 5 minutes, the account may be removed automatically.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (or Supabase)
- Twilio account (for SMS OTP)
- Email service (Gmail or other SMTP)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd portlib-backend
```
