# Deployment Guide for puranalytics.com

This guide will help you deploy Pürblack Analytics to puranalytics.com using Namecheap.

## Important: Database Consideration

**This app uses SQLite which requires persistent file storage.** 

- ⚠️ **Render Free Tier** - Does NOT support persistent disks (database resets on each deployment)
- ✅ **Render Starter ($7/month)** - Supports persistent disks for SQLite
- ✅ **Alternative**: Migrate to managed database (Supabase/PostgreSQL) for free tier compatibility
- ❌ **Vercel** - Not suitable - Serverless environment doesn't persist files (database would reset)

**Recommendation**: Use Render Starter plan ($7/month) for SQLite, OR migrate to Supabase for free tier.

If you want to use Vercel, you'll need to migrate from SQLite to a managed database (PostgreSQL, Supabase, etc.).

## Prerequisites

- Domain: puranalytics.com (configured on Namecheap)
- GitHub account (for Render deployment)
- A hosting provider (Render recommended for SQLite, see below)

## Option 1: Deploy to Render (Recommended for SQLite)

Vercel is the easiest way to deploy Next.js applications.

### Steps:

1. **Install Vercel CLI** (optional, you can use the web interface):
   ```bash
   npm i -g vercel
   ```

2. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add password protection"
   git push origin main
   ```

3. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `SITE_PASSWORD`: `Mark32246!`
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `NODE_ENV`: `production`

4. **Connect Domain**:
   - In Vercel dashboard, go to Project Settings → Domains
   - Add `puranalytics.com` and `www.puranalytics.com`
   - Update your Namecheap DNS:
     - Add an A record pointing to Vercel's IP (Vercel will provide this)
     - Or add a CNAME record pointing to `cname.vercel-dns.com`
     - Vercel will automatically configure SSL

## Option 2: Deploy to Your Own Server

### Server Setup:

1. **Install Node.js and PM2**:
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Clone and Build**:
   ```bash
   cd /var/www
   git clone <your-repo-url> puranalytics
   cd puranalytics
   npm install
   npm run build
   ```

3. **Create Environment File**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   Set:
   ```
   SITE_PASSWORD=Mark32246!
   OPENAI_API_KEY=your_key_here
   NODE_ENV=production
   ```

4. **Start with PM2**:
   ```bash
   pm2 start npm --name "puranalytics" -- start
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx** (Reverse Proxy):
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/puranalytics
   ```
   
   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name puranalytics.com www.puranalytics.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   
   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/puranalytics /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Setup SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d puranalytics.com -d www.puranalytics.com
   ```

## Option 2: Deploy to Vercel (Requires Database Migration)

**Note**: Vercel uses serverless functions with ephemeral filesystem. SQLite files won't persist. You'll need to migrate to a managed database first (PostgreSQL/Supabase, etc.).

If you want to use Vercel:
1. Migrate from SQLite to PostgreSQL/Supabase
2. Update database connection code
3. Then deploy to Vercel using their standard Next.js deployment

See Vercel documentation for database options.

## Namecheap DNS Configuration

### For Render Deployment:
See step 8 in the Render deployment section above.

### For Own Server Deployment:
1. Log into Namecheap
2. Go to Domain List → Manage → Advanced DNS
3. Add/Modify records:
   - **Type**: A Record
   - **Host**: @
   - **Value**: Your server's IP address
   - **TTL**: Automatic
   
   - **Type**: A Record
   - **Host**: www
   - **Value**: Your server's IP address
   - **TTL**: Automatic

**Note**: DNS changes can take 24-48 hours to propagate, but often complete within a few hours.

## Security Checklist

- ✅ Password protection implemented (Mark32246!)
- ✅ HTTPS/SSL certificate (automatically via Vercel or Let's Encrypt)
- ✅ Environment variables set (password not in code)
- ✅ HTTP-only cookies for session management
- ✅ Secure cookies in production

## After Deployment

1. Wait for Render to complete the build (usually 2-5 minutes)
2. Visit `https://puranalytics.com`
3. You should see the login page
4. Enter password: `Mark32246!`
5. You'll have access to the dashboard

**Important Note on Plans**:
- **Free/Hobby Plan**: ❌ **NOT suitable** - Does NOT support persistent disks. Your SQLite database will be wiped on each deployment. Do not use for this app.
- **Starter Plan ($7/month)**: ✅ **Required** - Includes persistent disks (needed for SQLite), always-on service, zero downtime, instant response times.

**You MUST use Starter plan ($7/month) to run this SQLite-based app on Render.**

## Changing the Password

To change the password:

1. Update the `SITE_PASSWORD` environment variable on your hosting platform
2. Restart the application

**Note**: If you change the password, all existing sessions will be invalidated (users will need to log in again).

## Troubleshooting

- **Can't access site**: Check DNS propagation with `dig puranalytics.com`
- **Login not working**: Verify `SITE_PASSWORD` environment variable is set correctly
- **SSL errors**: Ensure SSL certificate is properly installed
- **500 errors**: Check server logs and ensure all environment variables are set
