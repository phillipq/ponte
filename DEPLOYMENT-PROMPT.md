# AI App Deployment Prompt Template

## 🚀 **AI App Deployment Request**

I need help deploying a new AI application using my established template system. Here's the context and requirements:

### 📋 **Template System Overview**

I have a production-ready Next.js 15 template for standalone AI applications with the following capabilities:

- **Multi-App Architecture**: Each app is isolated with unique `appId` but shares centralized admin
- **User Management**: NextAuth.js with email/password + Google OAuth
- **Subscription Billing**: Stripe integration with webhooks and customer portal
- **Admin Dashboard**: Master admin manages all apps, individual apps have their own admin
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Deployment**: Vercel-ready with environment validation

### 📚 **Complete Documentation**

**CRITICAL**: Please read the complete template documentation at:
`/mnt/storage/projects/app-template/TEMPLATE-REFERENCE.md`

This file contains:
- Complete architecture overview
- Environment variable requirements
- Database schema details
- Authentication system setup
- Payment integration guide
- Admin system features
- Deployment process
- Troubleshooting guide
- Quick reference checklists

### 🎯 **New App Details**

**App Name**: [FILL IN: e.g., "AI Writing Assistant", "Code Generator", "Image Analyzer"]

**App Description**: [FILL IN: Brief description of what this AI app does]

**App Domain**: [FILL IN: e.g., "app1.mywebsite.com", "writing.mywebsite.com"]

**App ID**: [FILL IN: e.g., "app1", "writing", "codegen"]

**Target Users**: [FILL IN: e.g., "Content creators", "Developers", "Business professionals"]

**Key Features**: [FILL IN: List 3-5 main features this app will provide]

**Pricing Strategy**: [FILL IN: e.g., "Free tier + $9/month pro", "Freemium with usage limits"]

### 🔧 **Deployment Requirements**

1. **Environment Setup**: Configure all required environment variables
2. **Database Configuration**: Set up Supabase database with proper schema
3. **Stripe Integration**: Configure products, prices, and webhooks
4. **Domain Configuration**: Set up custom domain and SSL
5. **Admin Access**: Create admin user and test admin dashboard
6. **User Testing**: Verify registration, login, and subscription flow
7. **AI Integration**: Help integrate the specific AI functionality

### 🎨 **Customization Needs**

**UI/UX Customization**: [FILL IN: Any specific design requirements, branding, or UI changes needed]

**AI Model Integration**: [FILL IN: Which AI service/model to integrate - OpenAI, Anthropic, local model, etc.]

**Additional Features**: [FILL IN: Any features beyond the template that are needed]

**Third-Party Integrations**: [FILL IN: Any external services or APIs to integrate]

### 📊 **Success Criteria**

- [ ] App deploys successfully to Vercel
- [ ] Custom domain is active and working
- [ ] User registration and authentication works
- [ ] Subscription billing is functional
- [ ] Admin dashboard is accessible
- [ ] AI functionality is integrated and working
- [ ] All environment variables are properly configured
- [ ] Database is set up with proper schema
- [ ] Stripe webhooks are configured and tested

### 🚨 **Important Notes**

- This is a **production deployment** - ensure all security measures are in place
- The template already includes user management, billing, and admin features
- Focus on integrating the specific AI functionality for this app
- Use the template documentation as the primary reference
- Test all critical user flows before considering deployment complete

### 📞 **Support Context**

I'm familiar with the template system and have successfully deployed it before. I need help with:
- Environment configuration for this specific app
- AI model integration
- Any customizations beyond the template
- Testing and validation of the deployment

---

**Please use the TEMPLATE-REFERENCE.md file as your primary guide and help me deploy this new AI application successfully.**
