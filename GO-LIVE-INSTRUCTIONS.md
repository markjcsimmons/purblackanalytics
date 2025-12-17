# Go Live: Connect puranalytics.com to Render

Your build is successful! Follow these steps to make it live on puranalytics.com.

## Step 1: Add Custom Domain in Render (5 minutes)

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click on your service: **puranalytics**

2. **Add Custom Domain**
   - In the left sidebar, click **"Settings"**
   - Scroll down to **"Custom Domains"** section
   - Click **"Add Custom Domain"**
   - Enter: `puranalytics.com`
   - Click **"Save"**
   - Render will show you DNS configuration values (write these down!)

3. **Add WWW Subdomain (Optional but Recommended)**
   - Click **"Add Custom Domain"** again
   - Enter: `www.puranalytics.com`
   - Click **"Save"**

4. **Note the DNS Values**
   - Render will show you what DNS records to add
   - Usually it will show:
     - For root domain (`@`): An A record with an IP address OR a CNAME
     - For `www`: A CNAME pointing to your Render service

---

## Step 2: Configure DNS in Namecheap (10 minutes)

1. **Log into Namecheap**
   - Go to [namecheap.com](https://www.namecheap.com)
   - Log in to your account

2. **Access Domain Settings**
   - Click **"Domain List"** in the left sidebar
   - Find **puranalytics.com**
   - Click **"Manage"** button next to it

3. **Go to Advanced DNS**
   - Click the **"Advanced DNS"** tab at the top

4. **Remove Existing Records (if any)**
   - Delete any existing A records for `@`
   - Delete any existing CNAME records for `www`
   - Delete any URL Redirect records

5. **Add DNS Records**

   **For Root Domain (puranalytics.com):**
   
   **Option A: If Render shows an IP address:**
   - Click **"Add New Record"**
   - **Type**: `A Record`
   - **Host**: `@`
   - **Value**: (IP address from Render, usually `216.24.57.1`)
   - **TTL**: `Automatic` or `1 minute`
   - Click **"Save"** (checkmark icon)

   **Option B: If Render shows a CNAME:**
   - Click **"Add New Record"**
   - **Type**: `CNAME Record`
   - **Host**: `@`
   - **Value**: (CNAME value from Render, e.g., `puranalytics.onrender.com`)
   - **TTL**: `Automatic` or `1 minute`
   - Click **"Save"**

   **For WWW Subdomain (www.puranalytics.com):**
   - Click **"Add New Record"**
   - **Type**: `CNAME Record`
   - **Host**: `www`
   - **Value**: (Your Render service URL, e.g., `puranalytics.onrender.com`)
   - **TTL**: `Automatic` or `1 minute`
   - Click **"Save"**

6. **Verify Records**
   - You should have:
     - One A or CNAME record for `@` (root domain)
     - One CNAME record for `www`
   - Make sure there are no conflicting records

---

## Step 3: Wait for DNS Propagation & SSL (10-30 minutes)

1. **DNS Propagation**
   - DNS changes can take 5 minutes to 48 hours
   - Usually takes 10-30 minutes
   - You can check propagation status at: [whatsmydns.net](https://www.whatsmydns.net)

2. **SSL Certificate**
   - Render automatically provisions SSL certificates via Let's Encrypt
   - This happens automatically after DNS propagates
   - You'll see a green checkmark in Render when SSL is active

3. **Monitor in Render**
   - Go back to Render dashboard → Your service → Settings → Custom Domains
   - You'll see status indicators:
     - ⏳ "Pending" = Waiting for DNS
     - ✅ "Active" = Ready to go!

---

## Step 4: Verify Everything Works

1. **Test the Site**
   - Visit: `https://puranalytics.com`
   - Visit: `https://www.puranalytics.com`
   - Both should show the login page

2. **Test Login**
   - Password: `Mark32246!`
   - Should see your dashboard

3. **Test Data Persistence**
   - Add some test data
   - Redeploy the service (to verify data persists)
   - Check that data is still there ✅

---

## Troubleshooting

### "Site not loading" or "DNS not found"
- **Wait longer**: DNS can take up to 48 hours (usually 10-30 min)
- **Check DNS propagation**: Use [whatsmydns.net](https://www.whatsmydns.net)
- **Verify DNS records**: Double-check values in Namecheap match Render's instructions
- **Clear browser cache**: Try incognito/private mode

### "SSL Certificate Error"
- **Wait for SSL**: Render provisions SSL automatically (5-30 minutes after DNS)
- **Check in Render**: Settings → Custom Domains → Look for SSL status
- **Force SSL refresh**: Clear browser cache or try different browser

### "Can't access after DNS setup"
- **Verify environment variables**: Check `SITE_PASSWORD` and `OPENAI_API_KEY` are set
- **Check service status**: Make sure service is running in Render dashboard
- **Check build logs**: Ensure latest deployment succeeded

### "Data resets after redeploy"
- **Verify persistent disk**: Settings → Disks → Should see `sqlite-data` attached
- **Check mount path**: Should be `/opt/render/project/src/data`
- **Redeploy**: Manual Deploy → Deploy latest commit (after disk is attached)

---

## Quick Reference

**Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)  
**Namecheap Dashboard**: [ap.www.namecheap.com](https://ap.www.namecheap.com)  
**DNS Check Tool**: [whatsmydns.net](https://www.whatsmydns.net)  
**Your Site**: [puranalytics.com](https://puranalytics.com) (after setup)

---

## After Setup

Once everything is working:
- ✅ Site is live at `https://puranalytics.com`
- ✅ SSL certificate is active (HTTPS)
- ✅ Data persists across deployments
- ✅ Password protection is active

**You're all set!** 🎉
