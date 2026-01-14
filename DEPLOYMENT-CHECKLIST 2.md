# Deployment Checklist for puranalytics.com

## ✅ Prerequisites
- [x] Code is in GitHub
- [x] Render account created
- [x] Domain (puranalytics.com) on Namecheap

## Step-by-Step Deployment

### 1. Create Web Service on Render
- [ ] Go to [render.com](https://render.com) → Dashboard
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository: `purblack-analytics`
- [ ] Configure:
  - **Name**: `puranalytics`
  - **Region**: Choose closest to you
  - **Branch**: `main`
  - **Root Directory**: (leave empty)
  - **Runtime**: `Node`
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npm start`
  - **Plan**: **Starter** ($7/month) ⚠️ Required for persistent disks

### 2. Add Environment Variables
- [ ] Click "Advanced" → "Add Environment Variable"
- [ ] Add:
  - `SITE_PASSWORD` = `Mark32246!`
  - `OPENAI_API_KEY` = (your OpenAI API key)
  - `NODE_ENV` = `production`

### 3. Add Persistent Disk (IMPORTANT)
- [ ] After service is created, go to "Disks" in left sidebar
- [ ] Click "Attach Persistent Disk"
- [ ] Configure:
  - **Name**: `sqlite-data`
  - **Mount Path**: `/opt/render/project/src/data` ⚠️ Must match exactly
  - **Size**: 1GB
- [ ] Click "Attach"
- [ ] **Redeploy** service (Manual Deploy → Deploy latest commit)

### 4. Connect Domain
- [ ] In Render dashboard → Your service → Settings → Custom Domains
- [ ] Add: `puranalytics.com`
- [ ] Add: `www.puranalytics.com`
- [ ] Render will show DNS values to use

### 5. Configure Namecheap DNS
- [ ] Log into Namecheap
- [ ] Domain List → puranalytics.com → Manage → Advanced DNS
- [ ] Add CNAME records:
  - **Type**: CNAME
  - **Host**: `@`
  - **Value**: (value from Render - usually `puranalytics.onrender.com`)
  - **TTL**: Automatic
  
  - **Type**: CNAME  
  - **Host**: `www`
  - **Value**: (same value from Render)
  - **TTL**: Automatic
- [ ] Save changes

### 6. Verify Deployment
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Visit `https://puranalytics.com`
- [ ] Should see login page
- [ ] Login with password: `Mark32246!`
- [ ] Add test data, redeploy, verify data persists ✅

## Cost Summary
- **Render Starter Plan**: $7/month
- **Domain**: Already owned on Namecheap
- **OpenAI API**: Pay per use (you already have)
- **Total**: ~$7/month

## Troubleshooting
- **Can't access site**: DNS may still be propagating (up to 48 hours, usually much faster)
- **Login not working**: Check `SITE_PASSWORD` environment variable
- **Data resets**: Verify persistent disk is attached and mount path is correct
- **Build fails**: Check build logs in Render dashboard

## After Deployment
Your site will be live at:
- **https://puranalytics.com**
- **https://www.puranalytics.com**

Both will work and redirect to the same service.
