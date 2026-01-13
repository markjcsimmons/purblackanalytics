# Render Deployment Guide

This guide will help you deploy the Purblack Analytics application to Render.

## Prerequisites

- A Render account (sign up at [render.com](https://render.com))
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Create a New Web Service on Render

1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Render will auto-detect it's a Next.js app

### 2. Configure Build Settings

Render should auto-detect these settings from `render.yaml`, but verify:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: `Node`

### 3. Set Environment Variables

In the Render dashboard, go to Environment → Environment Variables and add:

- `FULL_ACCESS_PASSWORD` - Your full access password
- `NEXT_PUBLIC_FULL_ACCESS_PASSWORD` - Same password (needed for client-side auth)
- `NODE_ENV` - Set to `production` (usually set automatically)

### 4. Deploy

Click "Create Web Service" and Render will:
1. Install dependencies
2. Build the application
3. Start the service

## Common Build Issues and Solutions

### Issue: Build fails with TypeScript errors

**Solution**: Make sure Node.js version is 18+ (specified in `package.json` engines field)

### Issue: Filesystem write errors

**Solution**: The app is configured to handle ephemeral filesystems gracefully. Data persistence may not work on Render's filesystem, but the app will continue to function.

### Issue: API routes not working

**Solution**: Ensure the routes are marked as dynamic (already configured with `export const dynamic = 'force-dynamic'`)

### Issue: Environment variables not working

**Solution**: 
- Make sure variables are set in Render dashboard
- Redeploy after adding new environment variables
- Check that variable names match exactly (case-sensitive)

## Render-Specific Notes

- **Ephemeral Filesystem**: Render uses an ephemeral filesystem, so data written to the `data/` directory won't persist between deployments. The app handles this gracefully.
- **Auto-Deploy**: Render automatically deploys when you push to your main branch
- **Custom Domain**: You can add a custom domain in Render dashboard → Settings → Custom Domains

## Troubleshooting

1. **Check Build Logs**: Go to your service → Logs tab to see build errors
2. **Check Runtime Logs**: View runtime errors in the Logs tab
3. **Verify Environment Variables**: Make sure all required variables are set
4. **Node Version**: Ensure Node.js 18+ is being used (check in build logs)

## Manual Deployment

If auto-deploy is disabled, you can manually trigger deployments:
1. Go to your service
2. Click "Manual Deploy"
3. Select the branch/commit to deploy
