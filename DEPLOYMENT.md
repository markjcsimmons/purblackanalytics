# Deployment Guide for puranalytics.com

This guide will help you deploy the Purblack Analytics application to puranalytics.com.

## Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is the recommended platform for Next.js applications and offers free hosting with custom domains.

### Steps:

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy the application**:
```bash
vercel
```

4. **Add your custom domain**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Domains
   - Add `puranalytics.com` and `www.puranalytics.com`
   - Follow DNS configuration instructions

5. **Set Environment Variables**:
   - In Vercel Dashboard → Settings → Environment Variables
   - Add `FULL_ACCESS_PASSWORD` with your current password
   - Add `NEXT_PUBLIC_FULL_ACCESS_PASSWORD` with your current password
   - Redeploy after adding variables

6. **Production Deployment**:
```bash
vercel --prod
```

## Option 2: Deploy to Other Hosting Providers

### For Node.js Hosting (Heroku, Railway, etc.):

1. **Build the application**:
```bash
npm run build
```

2. **Start the server**:
```bash
npm start
```

3. **Set environment variables** in your hosting platform:
   - `FULL_ACCESS_PASSWORD` = your current password
   - `NEXT_PUBLIC_FULL_ACCESS_PASSWORD` = your current password

### For Static Hosting (if using static export):

Update `next.config.js` to add:
```javascript
output: 'export',
```

Then build and deploy the `out` folder.

## DNS Configuration

For puranalytics.com, you'll need to configure DNS records:

1. **For Vercel**:
   - Add a CNAME record pointing to `cname.vercel-dns.com`
   - Or add A records as specified in Vercel dashboard

2. **For other providers**:
   - Follow your hosting provider's DNS configuration instructions

## Environment Variables

**Important**: Set these environment variables in your hosting platform:

- `FULL_ACCESS_PASSWORD`: Your current password for full access
- `NEXT_PUBLIC_FULL_ACCESS_PASSWORD`: Same password (needed for client-side auth)

**Security Note**: For better security, consider implementing server-side authentication instead of client-side password checking.

## Post-Deployment Checklist

- [ ] Domain is properly configured and SSL certificate is active
- [ ] Environment variables are set correctly
- [ ] Test login with full access password
- [ ] Test login with limited access password (PB2026!)
- [ ] Verify limited access users can only see overview page
- [ ] Verify full access users can access all pages
- [ ] Test logout functionality

## Troubleshooting

- **Password not working**: Check that environment variables are set correctly
- **Domain not loading**: Verify DNS configuration and wait for propagation (can take up to 48 hours)
- **Build errors**: Check Node.js version (should be 18+)

