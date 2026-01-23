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
   - Add `GOOGLE_GEMINI_API_KEY` with your Google Gemini API key (see "Getting API Keys" section below)
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
- `GOOGLE_GEMINI_API_KEY` or `GEMINI_API_KEY`: Google Gemini API key for Google AI Overview search

**Security Note**: For better security, consider implementing server-side authentication instead of client-side password checking.

## Getting API Keys

### Google Gemini API Key

The application uses Google Gemini API with Google Search grounding for the "Google AI Overview" feature. To get your API key:

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API key"** in the left sidebar
4. Click **"Create API key"**
5. Choose an existing Google Cloud project or create a new one
6. Copy the API key (you'll only see it once - save it securely!)
7. Add it to your environment variables as `GOOGLE_GEMINI_API_KEY`

**Note**: 
- The Google Gemini API with Google Search grounding provides real-time web search results
- Billing for Google Search grounding begins January 5, 2026, but there's a free tier available
- You can also pass the API key as a query parameter: `?geminiApiKey=your-key` (for testing only - not recommended for production)

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

