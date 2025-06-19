# IYUUP Platform - Complete Production Deployment Guide

This comprehensive guide covers deploying the IYUUP online course marketplace platform to production using Vercel (frontend), Render (backend), and Neon (database).

## 🏗️ Architecture Overview

- **Frontend**: React + TypeScript + Vite → Vercel
- **Backend**: Node.js + Express + Drizzle ORM → Render
- **Database**: PostgreSQL → Neon
- **Payments**: HyperSwitch integration
- **Authentication**: JWT-based with KYC verification
- **Notifications**: Real-time system for KYC and sales events

## 📋 Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed locally
- Git repository with your code
- Accounts created on:
  - [Vercel](https://vercel.com)
  - [Render](https://render.com)
  - [Neon](https://neon.tech)
  - [HyperSwitch](https://hyperswitch.io) (for payments)
  - [Resend](https://resend.com) (for emails)

## 🗄️ Step 1: Database Setup (Neon)

### 1.1 Create Neon Database
1. Visit [neon.tech](https://neon.tech) and sign up/login
2. Click "Create Project"
3. Choose a region close to your users
4. Note down the connection details

### 1.2 Configure Database Schema
1. Copy your connection string from Neon dashboard
2. Create a `.env` file in your project root:
   ```env
   DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
   ```
3. Run the schema migration:
   ```bash
   npm install
   npm run db:push
   ```

### 1.3 Verify Database Setup
- Check that all tables are created in Neon console
- Test connection with a simple query

## 🚀 Step 2: Backend Deployment (Render)

### 2.1 Prepare Backend for Production
1. Create `render.yaml` in your project root:
   ```yaml
   services:
     - type: web
       name: iyuup-backend
       env: node
       region: oregon
       plan: starter
       buildCommand: npm install && npm run build:server
       startCommand: npm run start:server
       healthCheckPath: /health
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 10000
   
   databases:
     - name: iyuup-postgres
       databaseName: iyuup
       user: iyuup_user
   ```

2. Add production scripts to `package.json`:
   ```json
   {
     "scripts": {
       "build:server": "tsc server/**/*.ts --outDir dist/server",
       "start:server": "node dist/server/index.js",
       "start:prod": "NODE_ENV=production node server/index.js"
     }
   }
   ```

### 2.2 Deploy to Render
1. Go to [render.com](https://render.com) and login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: iyuup-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:prod`
   - **Auto-Deploy**: Yes

### 2.3 Configure Environment Variables
In Render dashboard, add these environment variables:

```env
NODE_ENV=production
DATABASE_URL=your_neon_connection_string
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
HYPERSWITCH_API_KEY=your_hyperswitch_api_key
HYPERSWITCH_PUBLISHABLE_KEY=your_hyperswitch_publishable_key
RESEND_API_KEY=your_resend_api_key
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### 2.4 Verify Backend Deployment
- Check deployment logs in Render dashboard
- Test API endpoints: `https://your-backend.onrender.com/health`
- Verify database connectivity

## 🌐 Step 3: Frontend Deployment (Vercel)

### 3.1 Prepare Frontend for Production
1. Update `vite.config.ts` for production:
   ```typescript
   export default defineConfig({
     // ... existing config
     build: {
       outDir: 'dist',
       sourcemap: false,
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
           }
         }
       }
     }
   });
   ```

2. Create production environment file `.env.production`:
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   VITE_HYPERSWITCH_PUBLISHABLE_KEY=your_hyperswitch_publishable_key
   ```

### 3.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and login
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (if monorepo, adjust accordingly)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.3 Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_HYPERSWITCH_PUBLISHABLE_KEY=pk_dev_or_live_key_from_hyperswitch
NODE_ENV=production
```

### 3.4 Configure Custom Domain (Optional)
1. Go to Vercel dashboard → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update CORS_ORIGIN in backend to match your domain

## 🔧 Step 4: Third-Party Service Configuration

### 4.1 HyperSwitch Payment Setup
1. Login to HyperSwitch dashboard
2. Create production environment
3. Configure payment processors
4. Get API keys and add to environment variables
5. Set up webhooks pointing to: `https://your-backend.onrender.com/api/webhooks/hyperswitch`

### 4.2 Resend Email Setup
1. Login to Resend dashboard
2. Verify your sending domain
3. Create API key
4. Add to environment variables

### 4.3 Configure CORS for Production
Update backend CORS configuration:
```javascript
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

## 📊 Step 5: Database Migration and Seeding

### 5.1 Run Production Migrations
```bash
# Connect to production database
export DATABASE_URL="your_neon_production_url"
npm run db:push
```

### 5.2 Create Initial Admin User
```bash
# Run this script in production environment
npm run seed:admin
```

## 🔒 Step 6: Security Configuration

### 6.1 Environment Security
- Use strong, unique secrets for JWT_SECRET (minimum 32 characters)
- Enable database SSL in production
- Set secure cookie settings
- Configure rate limiting

### 6.2 API Security
- Implement request validation
- Add authentication middleware
- Configure HTTPS redirects
- Set up security headers

## 📈 Step 7: Monitoring and Logging

### 7.1 Application Monitoring
- Monitor Render service health
- Set up Vercel analytics
- Configure Neon database monitoring
- Implement error tracking (e.g., Sentry)

### 7.2 Performance Optimization
- Enable gzip compression
- Configure CDN for static assets
- Optimize database queries
- Set up caching strategies

## 🚨 Step 8: Backup and Recovery

### 8.1 Database Backups
- Configure automated Neon backups
- Set up point-in-time recovery
- Test backup restoration process

### 8.2 Code Backups
- Ensure Git repository is properly backed up
- Tag production releases
- Document rollback procedures

## ✅ Step 9: Production Checklist

Before going live, verify:

- [ ] All environment variables are set correctly
- [ ] Database schema is up to date
- [ ] API endpoints respond correctly
- [ ] Authentication flow works
- [ ] Payment processing is functional
- [ ] Email notifications are working
- [ ] KYC document upload/approval process works
- [ ] Admin panel is accessible
- [ ] Course creation and purchasing flow works
- [ ] Affiliate system is functional
- [ ] SSL certificates are properly configured
- [ ] Custom domains are working (if applicable)
- [ ] Monitoring and logging are set up
- [ ] Backup systems are in place

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Backend Issues
**Problem**: Service won't start on Render
- Check environment variables are set
- Verify DATABASE_URL format
- Check build logs for dependency issues

**Problem**: Database connection errors
- Verify Neon database is running
- Check connection string format
- Ensure SSL is enabled

#### Frontend Issues
**Problem**: API calls failing
- Check VITE_API_URL is correct
- Verify CORS configuration on backend
- Check network tab for actual errors

**Problem**: Build failures on Vercel
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check build logs for specific errors

#### Payment Issues
**Problem**: HyperSwitch payments failing
- Verify API keys are correct
- Check webhook configuration
- Test in sandbox mode first

## 📞 Support

For deployment issues:
1. Check service-specific documentation
2. Review application logs
3. Verify environment variables
4. Test locally with production configuration

## 🔄 Maintenance

### Regular Tasks
- Monitor service health
- Update dependencies
- Review security settings
- Backup verification
- Performance optimization

### Updates and Releases
- Use Git tags for releases
- Test in staging environment
- Plan maintenance windows
- Communicate with users about updates

This completes the comprehensive deployment guide for the IYUUP platform. Follow each step carefully and test thoroughly before going live with real users and payments.