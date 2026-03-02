# TrendSyria E-Commerce Platform - PRD

## Original Problem Statement
Multi-vendor e-commerce platform similar to "Trendyol" for the Syrian market with:
- User management with admin role control
- Category system with sub-categories and images
- Email verification for new registrations
- Order management with cancellation feature
- Professional UI/UX design

## User Personas
1. **Customers** - Browse, purchase products, manage orders
2. **Store Owners** - Manage products, view orders
3. **Admins** - Manage users, categories, approve stores
4. **Super Admin** - Full control including role management

## Core Requirements

### Authentication
- [x] JWT-based authentication
- [x] User registration with email verification flow (UI ready)
- [ ] Email verification via SMTP (IN PROGRESS - needs App Password)
- [x] Password reset functionality

### User Management
- [x] Admin can change user roles
- [x] Super admin restriction for role changes

### Categories
- [x] Nested category structure with subcategories
- [x] Image-based subcategory navigation
- [x] Auto-seeding on server startup

### Orders
- [x] Order creation and tracking
- [x] Order cancellation with reason

### Payments (UI Only - MOCKED)
- [ ] Stripe integration (test keys only)
- [ ] Sham Cash
- [ ] Bank Transfer

## What's Been Implemented

### 2025-03-02 - CORS Fix
- Fixed CORS middleware configuration for production domains
- Added support for trend-syria.com and www.trend-syria.com
- Moved CORS middleware to correct position in app initialization

### Previous Session
- Admin role management system
- Category restructuring with subcategories
- Order cancellation with reasons
- Professional product card design
- Separate Food and Supermarket pages
- UI/UX improvements (header, about us, dashboard buttons)

## Technical Architecture

### Backend
- FastAPI with MongoDB
- JWT authentication
- SMTP configuration (partial)

### Frontend
- React with Tailwind CSS
- Shadcn UI components

## API Endpoints
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/verify-email` - Email verification
- `/api/users/{id}/role` - Role management
- `/api/orders/{id}/cancel` - Order cancellation

## Prioritized Backlog

### P0 (Critical)
- [ ] Complete SMTP email sending (requires Google App Password)

### P1 (High Priority)
- [ ] Refactor backend/server.py (2000+ lines)
- [ ] Paid product promotions

### P2 (Medium Priority)
- [ ] Activate real payments
- [ ] Vendor reports & analytics
- [ ] WhatsApp OTP verification (Twilio)

## Credentials
- Admin: trendsyria926@gmail.com / admin123
- Super Admin: burhan.saar@trendsyria.com / admin123
