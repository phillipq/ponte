# 👨‍💼 Admin Dashboard Guide

## Overview

The admin dashboard provides centralized management of users and subscriptions across all your AI applications. Access it at `/admin` (only visible to admin users).

## 🔐 **Admin Access**

### **Setting Up Admin Access**

1. **Update Admin Email**: In all admin-related files, replace `admin@yourdomain.com` with your actual admin email:
   - `app/admin/page.tsx`
   - `app/api/admin/users/[userId]/route.ts`
   - `app/api/admin/users/bulk/route.ts`
   - `app/api/admin/subscriptions/[userId]/route.ts`
   - `components/Navigation.tsx`

2. **Create Admin User**: Register with your admin email address to gain access

## 📊 **Dashboard Features**

### **Analytics Overview**
- **Total Users**: Across all applications
- **Active Subscriptions**: Currently paying users
- **Estimated Monthly Revenue**: Based on active subscriptions
- **Active Apps**: Number of deployed applications
- **User Distribution**: Breakdown by application
- **Subscription Status**: Active, canceled, past due, free users

### **User Management**

#### **Individual User Actions**
- **View**: See detailed user information
- **Suspend**: Cancel subscription and restrict access
- **Delete**: Permanently remove user and all data
- **Verify Email**: Mark email as verified

#### **Bulk User Actions**
- **Select All**: Choose all users at once
- **Delete Users**: Remove multiple users
- **Suspend Users**: Cancel subscriptions for multiple users
- **Verify Email**: Mark multiple emails as verified
- **Export Data**: Export user information

#### **User Information Displayed**
- Name and email
- Application (appId)
- Email verification status
- Subscription status
- Join date
- Quick action buttons

### **Subscription Management**

#### **Free Trial Management**
- **Select User**: Choose from free users
- **Trial Duration**: Set 1-90 days
- **Grant Trial**: Give free access to premium features

#### **Subscription Actions**
- **Cancel Subscription**: Stop recurring billing
- **Reactivate**: Restore canceled subscription
- **Issue Refund**: Process customer refunds
- **Upgrade Plan**: Move to higher tier
- **Downgrade Plan**: Move to lower tier

#### **Subscription Overview**
- **Active Subscriptions**: Currently paying users
- **Canceled Subscriptions**: Users who canceled
- **Free Users**: Users without subscriptions
- **Recent Subscriptions**: Latest subscription activity

## 🛠️ **API Endpoints**

### **User Management APIs**

#### **Individual User Actions**
```bash
POST /api/admin/users/[userId]
{
  "action": "delete" | "suspend" | "verify" | "view"
}
```

#### **Bulk User Actions**
```bash
POST /api/admin/users/bulk
{
  "userIds": ["user1", "user2", "user3"],
  "action": "delete" | "suspend" | "verify" | "export"
}
```

### **Subscription Management APIs**

#### **Subscription Actions**
```bash
POST /api/admin/subscriptions/[userId]
{
  "action": "give_trial" | "cancel" | "reactivate" | "refund" | "upgrade" | "downgrade" | "view",
  "trialDays": 7,  // for give_trial
  "planId": "price_123"  // for upgrade/downgrade
}
```

## 🎯 **Common Use Cases**

### **Customer Support Scenarios**

#### **1. User Requests Refund**
1. Go to Admin Dashboard
2. Find user in User Management
3. Click "View" to see subscription details
4. Use "Issue Refund" action
5. Confirm refund amount and reason

#### **2. User Wants Free Trial**
1. Go to Subscription Management
2. Select user from free users list
3. Set trial duration (e.g., 7 days)
4. Click "Give Trial"
5. User gets immediate access

#### **3. User Cancels but Wants to Reactivate**
1. Find user in User Management
2. Check subscription status
3. Use "Reactivate" action
4. User's subscription resumes

#### **4. User Account Issues**
1. Find user by email
2. Check verification status
3. Use "Verify Email" if needed
4. Use "Suspend" if account is problematic

### **Business Operations**

#### **1. Monthly Revenue Review**
1. Check "Estimated Monthly Revenue" in analytics
2. Review "Active Subscriptions" count
3. Identify trends in user growth

#### **2. App Performance Analysis**
1. Review "Users by App" breakdown
2. Identify which apps are most popular
3. Plan resource allocation

#### **3. User Growth Tracking**
1. Monitor "Total Users" over time
2. Track conversion from free to paid
3. Analyze subscription status distribution

## 🔒 **Security Considerations**

### **Admin Access Control**
- Only users with admin email can access `/admin`
- All admin APIs check for admin privileges
- Admin actions are logged (consider adding audit logs)

### **Data Protection**
- User deletion is permanent and irreversible
- Subscription cancellations are immediate
- Refunds are processed through Stripe

### **Best Practices**
- Use admin access sparingly
- Document all admin actions
- Regular backup of user data
- Monitor for unusual admin activity

## 📈 **Advanced Features**

### **Custom Admin Actions**
You can extend the admin dashboard by:

1. **Adding New Actions**: Modify the API routes to include custom actions
2. **Custom Analytics**: Add new metrics and charts
3. **Automated Workflows**: Create scheduled tasks for user management
4. **Audit Logging**: Track all admin actions for compliance

### **Integration with External Tools**
- **Stripe Dashboard**: For detailed payment analytics
- **Supabase Dashboard**: For database management
- **Analytics Tools**: For user behavior tracking

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Admin Access Denied**
- Verify admin email is set correctly
- Ensure user is logged in with admin email
- Check that admin email matches in all files

#### **User Actions Fail**
- Check Stripe API keys are valid
- Verify database connection
- Ensure user exists in database

#### **Subscription Actions Fail**
- Verify Stripe subscription exists
- Check subscription status
- Ensure proper Stripe permissions

### **Error Messages**
- **"Unauthorized"**: User not logged in
- **"Forbidden"**: User not admin
- **"User not found"**: Invalid user ID
- **"No subscription found"**: User has no active subscription

## 📞 **Support**

For admin dashboard issues:
1. Check browser console for errors
2. Verify API endpoints are working
3. Check database and Stripe connections
4. Review server logs for detailed errors

---

**The admin dashboard gives you complete control over your multi-app user base!** 🎉
