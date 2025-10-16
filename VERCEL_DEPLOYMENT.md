# 🚀 Deploying CryptoWallet to Vercel

This guide will help you deploy your CryptoWallet application to Vercel with both the Next.js frontend and Express.js backend.

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] A Vercel account ([sign up here](https://vercel.com))
- [ ] Vercel CLI installed: `npm install -g vercel`
- [ ] A MongoDB Atlas database (recommended for production)
- [ ] All required environment variables ready

## 🛠 Preparation Steps

### 1. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Install Vercel CLI globally
npm install -g vercel
```

### 2. Set Up MongoDB Atlas

1. Create a MongoDB Atlas account at https://mongodb.com
2. Create a new cluster
3. Create a database user
4. Whitelist your IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string

### 3. Prepare Environment Variables

Copy the environment variables from `.env.vercel.example` and prepare them for Vercel:

**Required Variables:**
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - A secure random string (minimum 32 characters)
- `ENCRYPTION_KEY` - Exactly 32 characters for AES-256 encryption
- `NODE_ENV=production`

**Optional Variables:**
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` - For transactional emails
- `CLIENT_URL` - Will be auto-set by Vercel
- Various blockchain API keys if using real blockchain features

## 🚀 Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Your Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: `Next.js`
   - Root Directory: `.` (root)
   - Build Command: `npm run build:vercel`
   - Output Directory: `client/.next`
   - Install Command: `npm run install:all`

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.vercel.example`
   - Make sure to set them for Production, Preview, and Development environments

4. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete

### Method 2: Deploy via CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy to Production**
   ```bash
   # From project root
   vercel --prod
   ```

3. **Set Environment Variables via CLI**
   ```bash
   # Set required environment variables
   vercel env add MONGODB_URI production
   vercel env add JWT_SECRET production
   vercel env add ENCRYPTION_KEY production
   vercel env add NODE_ENV production
   ```

## ⚙️ Configuration Details

### Project Structure for Vercel

```
cryptowallet/
├── api/                    # Serverless functions
│   └── index.js           # Main API handler
├── client/                # Next.js frontend
│   ├── src/
│   ├── public/
│   ├── next.config.ts
│   └── package.json
├── server/                # Express backend
│   ├── vercel.js         # Vercel-optimized server
│   ├── index.js          # Original server (for local dev)
│   └── ... (routes, models, etc.)
├── vercel.json           # Vercel configuration
├── package.json          # Root package.json
└── .env.vercel.example   # Environment variables template
```

### Key Files

1. **`vercel.json`** - Main Vercel configuration
2. **`client/next.config.ts`** - Next.js configuration with API rewrites
3. **`server/vercel.js`** - Serverless-optimized Express server
4. **`api/index.js`** - Serverless function wrapper

## 🔧 Environment Variables Setup

### In Vercel Dashboard

1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add these variables:

```env
# Core Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cryptowallet
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-chars
ENCRYPTION_KEY=your32characterencryptionkeyhere!!
NODE_ENV=production

# Optional
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Generate Secure Keys

```bash
# Generate JWT Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key (32 characters exactly)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 🚦 Testing Your Deployment

### 1. Check Health Endpoint
```bash
curl https://your-app.vercel.app/health
```

### 2. Test API Documentation
```bash
curl https://your-app.vercel.app/api/docs
```

### 3. Test Frontend
- Visit `https://your-app.vercel.app`
- Try user registration/login
- Create a test wallet
- Verify all functionality works

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify MongoDB URI is correct
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

2. **API Routes Not Working**
   - Check `vercel.json` configuration
   - Verify `next.config.ts` rewrites
   - Check Vercel function logs

3. **Environment Variables Not Found**
   - Ensure all required variables are set
   - Check variable names match exactly
   - Redeploy after adding variables

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check build logs for specific errors

### Debugging

1. **View Function Logs**
   ```bash
   vercel logs
   ```

2. **Local Development with Vercel**
   ```bash
   vercel dev
   ```

3. **Check Build Status**
   - Go to Vercel Dashboard → Deployments
   - Click on a deployment to see detailed logs

## 🔄 Updates and Redeployment

### Automatic Deployments
- Push to your main branch to trigger automatic deployment
- Vercel will automatically build and deploy changes

### Manual Redeployment
```bash
vercel --prod
```

### Environment Variable Updates
- Add/update variables in Vercel Dashboard
- Redeploy to apply changes

## 📊 Monitoring and Analytics

### Built-in Vercel Analytics
- View performance metrics in Vercel Dashboard
- Monitor function execution times
- Track deployment frequency

### Custom Monitoring
- Add logging to your API endpoints
- Use Vercel's Web Analytics
- Monitor database performance in MongoDB Atlas

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Strong JWT secrets (32+ characters)
- [ ] Secure encryption keys
- [ ] MongoDB Atlas IP restrictions
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Environment variables secured

### Regular Security Updates
- Keep dependencies updated
- Monitor security alerts
- Regularly rotate JWT secrets
- Review access logs

## 🌐 Custom Domain (Optional)

### Add Custom Domain
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS settings
4. Wait for verification

### SSL Certificate
- Vercel automatically provides SSL certificates
- No additional configuration needed

## 📝 Post-Deployment Checklist

After successful deployment:

- [ ] Test all major features
- [ ] Verify database connectivity
- [ ] Test user registration/login
- [ ] Check wallet creation/management
- [ ] Verify API endpoints respond correctly
- [ ] Test responsive design on mobile
- [ ] Monitor initial performance metrics
- [ ] Set up error monitoring/alerts

## 🆘 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express.js Production Guide](https://expressjs.com/en/advanced/best-practice-performance.html)

## 🎉 Success!

Your CryptoWallet application should now be live on Vercel! 

**Your app URLs:**
- Frontend: `https://your-app.vercel.app`
- API: `https://your-app.vercel.app/api`
- Health Check: `https://your-app.vercel.app/health`
- API Docs: `https://your-app.vercel.app/api/docs`

Remember to keep your environment variables secure and monitor your application performance regularly.