# Vercel Environment Variables Setup

Copy these EXACT environment variables to your Vercel project:

## **Required Environment Variables**

### **Database**
```
ALUDAAI_DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require&channel_binding=require
```

### **Authentication (CRITICAL for Vercel)**
```
ALUDAAI_NEXTAUTH_SECRET=generate-a-very-long-random-secret-here
ALUDAAI_NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=generate-a-very-long-random-secret-here
```

### **Flowise Integration**
```
ALUDAAI_FLOWISE_HOST=https://flowise-eden.onrender.com
ALUDAAI_FLOWISE_CHATFLOW_ID=9a1520d5-52e3-4365-9c47-27c89f40ddeb
ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2=ed45f6f4-88bd-4f11-9fa5-019103b542d2
ALUDAAI_FLOWISE_API_KEY=
ALUDAAI_FLOWISE_MODE=api
```

## **How to Set in Vercel**

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable above
4. Set **Environment** to: Production, Preview, Development (check all)
5. Click "Save"

## **Generate Secret Key**

Use this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Or visit: https://generate-secret.vercel.app/32

## **After Deployment**

1. Deploy your project
2. Call this API to initialize database:
   ```
   POST https://your-project-name.vercel.app/api/init-db
   ```

## **Why This Fixes Vercel Issues**

- **JWT Decryption Errors** → Fixed with proper NEXTAUTH_SECRET
- **Session Management** → Fixed with proper NEXTAUTH_URL
- **Database Connection** → Fixed with proper ALUDAAI_DATABASE_URL
- **Authentication Flow** → Fixed with proper NextAuth configuration

## **Test Your App**

After setup, test:
- ✅ User registration
- ✅ User login  
- ✅ Chat functionality
- ✅ All API endpoints

Your app should work exactly like it does locally! 🎉
