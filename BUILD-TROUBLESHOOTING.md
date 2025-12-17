# Build Troubleshooting Guide

If the build keeps failing on Render, try these steps:

## Option 1: Manual Deployment (Skip render.yaml)

Instead of using `render.yaml`, create the service manually in Render dashboard:

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: puranalytics
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `NODE_VERSION` = `20`
   - `SITE_PASSWORD` = `Mark32246!`
   - `OPENAI_API_KEY` = (your key)
5. Add Persistent Disk:
   - Name: `sqlite-data`
   - Mount Path: `/opt/render/project/src/data`
   - Size: 1 GB

## Option 2: Check Build Logs

In Render dashboard, check the build logs for the specific error. Common issues:

- **Module not found**: Add missing dependency to package.json
- **TypeScript errors**: Fix type errors in code
- **Memory issues**: Upgrade to Starter plan (already done)
- **Native module errors**: Check better-sqlite3 compilation

## Option 3: Simplify Build

If issues persist, try removing the disk temporarily to see if that's the issue:

1. Comment out the `disk:` section in render.yaml
2. Deploy and see if build succeeds
3. If it works, the issue is with disk configuration
4. If it fails, the issue is with the build itself

## Option 4: Use Docker

As a last resort, create a Dockerfile for more control:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Then update render.yaml to use Docker instead of Node.
