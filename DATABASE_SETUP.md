# Database Setup Guide for AludaAI

This guide will help you set up your database and fix the authentication/chat issues.

## **Quick Fix (Recommended)**

### **Step 1: Set Environment Variables in Vercel**

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

```
ALUDAAI_DATABASE_URL=your_neon_database_connection_string
ALUDAAI_NEXTAUTH_SECRET=generate_random_secret_here
ALUDAAI_NEXTAUTH_URL=https://your-project-name.vercel.app
ALUDAAI_FLOWISE_HOST=https://flowise-eden.onrender.com
ALUDAAI_FLOWISE_CHATFLOW_ID=9a1520d5-52e3-4365-9c47-27c89f40ddeb
ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2=ed45f6f4-88bd-4f11-9fa5-019103b542d2
ALUDAAI_FLOWISE_API_KEY=
ALUDAAI_FLOWISE_MODE=api
```

### **Step 2: Redeploy Your Project**

1. Go to Vercel → Deployments
2. Click "Redeploy" on your latest deployment
3. The build script will automatically initialize your database

### **Step 3: Initialize Database After Deployment**

After redeploying, call this API endpoint to initialize your database:

```
POST /api/init-db
```

Or visit: `https://your-project-name.vercel.app/api/init-db`

This will create all the necessary database tables.

## **Manual Database Setup (if automatic fails)**

### **Option 1: Use the Init Script**

```bash
# Make sure you have your database URL set
export ALUDAAI_DATABASE_URL="your_database_connection_string"

# Run the initialization script
npm run init-db
```

### **Option 2: Use Prisma Commands**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

## **Test Your Database**

After setup, test if everything works:

```bash
npm run test-db
```

## **What These Scripts Do**

### **`scripts/init-db.js`**
- Generates Prisma client
- Tries to push schema directly
- Falls back to migrations if push fails
- Creates tables manually if both fail
- Verifies all tables exist

### **`vercel-build.sh`**
- Automatically runs during Vercel deployment
- Initializes database before building the app
- Ensures database is ready when app starts

### **`scripts/test-db.js`**
- Tests database connection
- Tests table creation and access
- Tests basic CRUD operations
- Cleans up test data

## **Troubleshooting**

### **If you get "table doesn't exist" errors:**
Run: `npm run init-db`

### **If you get "connection failed" errors:**
Check your `ALUDAAI_DATABASE_URL` in Vercel environment variables

### **If you get "Prisma client not generated" errors:**
Run: `npm run db:generate`

## **Expected Result**

After successful setup, you should see:
- ✅ User registration working
- ✅ User login working
- ✅ Chat functionality working
- ✅ Token tracking working

## **Database Tables Created**

- `User` - User accounts and authentication
- `Account` - OAuth provider accounts
- `Session` - User sessions
- `VerificationToken` - Email verification
- `Chat` - Chat conversations
- `Message` - Chat messages
- `TokenUsage` - Token consumption tracking

## **Need Help?**

If you still have issues:
1. Check Vercel build logs for errors
2. Run `npm run test-db` to see specific issues
3. Verify all environment variables are set correctly
