# Step-by-Step: Add Persistent Disk to Render

Follow these exact steps to add the persistent disk so your data will survive deployments.

## Step 1: Go to Your Service

1. **Open Render Dashboard**
   - Go to: https://dashboard.render.com
   - Log in if needed

2. **Find Your Service**
   - Look for the service named: **puranalytics**
   - Click on it to open the service dashboard

---

## Step 2: Navigate to Disks Section

1. **Look at the Left Sidebar**
   - You'll see menu items like: Overview, Logs, Metrics, Settings, etc.

2. **Click on "Disks"**
   - It's in the left sidebar menu
   - If you don't see it, try scrolling down in the sidebar
   - OR look for it in the main content area

---

## Step 3: Attach the Disk

1. **Click "Attach Persistent Disk" Button**
   - You should see a button that says "Attach Persistent Disk" or similar
   - Click it

2. **A Form Will Appear** - Fill it out with these EXACT values:

   **Name:**
   ```
   sqlite-data
   ```

   **Mount Path:**
   ```
   /opt/render/project/src/data
   ```
   ⚠️ **IMPORTANT**: Copy this EXACTLY - it must match this path

   **Size:**
   ```
   1
   ```
   (This means 1 GB - minimum size)

3. **Click "Attach" or "Save"**
   - The button might say "Attach", "Create", or "Save"
   - Click it to create the disk

---

## Step 4: Wait for Disk to Attach

1. **You'll See a Status**
   - The disk will show as "Attaching" or "Creating"
   - Wait 30-60 seconds for it to complete
   - Status should change to "Attached" ✅

---

## Step 5: Redeploy Your Service

**Important**: After attaching the disk, you MUST redeploy for it to be available.

1. **Go to "Manual Deploy" Section**
   - In the left sidebar, click **"Manual Deploy"**
   - OR look for a "Deploy" button in the top right

2. **Click "Deploy latest commit"**
   - This will redeploy your service with the disk attached
   - Wait 2-3 minutes for deployment to complete

---

## Step 6: Verify It's Working

1. **Check Disk Status**
   - Go back to **"Disks"** section
   - You should see:
     - ✅ `sqlite-data` listed
     - ✅ Status: "Attached"
     - ✅ Mount Path: `/opt/render/project/src/data`
     - ✅ Size: 1 GB

2. **Test Data Persistence**
   - Go to https://puranalytics.com
   - Log in
   - Check if your week data is there (Dec 4-10, 2025)
   - Add a test entry if needed
   - Trigger another redeploy
   - Check again - data should still be there! ✅

---

## Troubleshooting

### "Disks" Option Not Visible

**If you don't see "Disks" in the sidebar:**
- Make sure you're on the **Starter plan** ($7/month)
- Free tier doesn't support persistent disks
- Upgrade to Starter plan first

### Mount Path Error

**If you get an error about mount path:**
- Make sure it's EXACTLY: `/opt/render/project/src/data`
- No trailing slashes
- No typos
- Case-sensitive

### Disk Creation Fails

**If disk creation fails:**
- Check you're on Starter plan
- Try a different name (e.g., `sqlite-db` instead of `sqlite-data`)
- Check Render status page for service issues

### Service Won't Start After Adding Disk

**If service fails to start:**
- Check the "Logs" tab for errors
- Verify mount path is correct
- Try detaching and re-attaching the disk

---

## Quick Reference

**Disk Configuration:**
- **Name**: `sqlite-data`
- **Mount Path**: `/opt/render/project/src/data`
- **Size**: `1` GB
- **Plan Required**: Starter ($7/month)

**After Adding:**
1. ✅ Disk shows "Attached" status
2. ✅ Redeploy service
3. ✅ Data will now persist across deployments

---

## What This Does

Once the persistent disk is attached:
- ✅ Your SQLite database file will be stored on the disk
- ✅ Data will survive deployments, restarts, and updates
- ✅ The database file is at: `/opt/render/project/src/data/analytics.db`
- ✅ This path is on the persistent disk, not ephemeral storage

**You're all set!** After completing these steps, your data will persist. 🎉
