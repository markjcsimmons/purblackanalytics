# Check if Database Data Was Lost

## How the Database Works on Render

The SQLite database file (`analytics.db`) is stored on a **persistent disk** that should survive deployments. However, data can be lost if:

1. **Persistent disk wasn't attached** before first data entry
2. **Disk mount path doesn't match** the database path
3. **Service was recreated** (not just redeployed)
4. **Disk was detached** or recreated

## Check if Data Exists

### Option 1: Check via the Website

1. Go to https://puranalytics.com
2. Log in
3. Go to **"Overview"** tab
4. Look at the **week selector dropdown** (top right)
   - If you see "Dec 4 - Dec 10, 2025" → **Data exists! ✅**
   - If dropdown is empty → **Data was lost ❌**

### Option 2: Check Render Logs

1. Go to Render Dashboard → Your service → **"Logs"** tab
2. Look for database-related errors or initialization messages
3. Check if the database file is being accessed

### Option 3: Verify Persistent Disk

1. Go to Render Dashboard → Your service
2. Click **"Disks"** in the left sidebar
3. Check:
   - Is `sqlite-data` disk listed? ✅
   - Is it **attached**? ✅
   - Mount path: `/opt/render/project/src/data` ✅
   - Size: 1GB ✅

## Common Scenarios

### Scenario 1: Disk Wasn't Attached Initially

**What happened:**
- Data was added before the persistent disk was attached
- Database was created in ephemeral storage
- New deployment wiped the data

**Solution:**
- Attach the persistent disk now (if not already)
- Re-add the data
- Future data will persist

### Scenario 2: Service Was Recreated

**What happened:**
- Service was deleted and recreated (not just redeployed)
- Persistent disk might have been detached
- New service = new ephemeral storage

**Solution:**
- Re-attach the persistent disk to the new service
- Re-add the data

### Scenario 3: Mount Path Mismatch

**What happened:**
- Database path doesn't match disk mount path
- Data is being written to wrong location

**Current Configuration:**
- Database path: `process.cwd()/data/analytics.db`
- On Render: `/opt/render/project/src/data/analytics.db`
- Disk mount: `/opt/render/project/src/data` ✅ (should match)

## Fix: Re-add the Data

If data was lost, you can re-add it:

### Quick Re-add via API

I can run the same script we used before to add the December 4-10, 2025 data again.

### Or Add Manually

1. Go to https://puranalytics.com
2. Log in
3. Go to **"Add Data"** tab
4. Re-enter the week data (see `DATA-ENTRY-GUIDE.md`)

## Prevent Future Data Loss

### Ensure Persistent Disk is Attached

1. **Render Dashboard** → Your service → **"Disks"**
2. Verify `sqlite-data` disk is:
   - ✅ Listed
   - ✅ Attached
   - ✅ Mount path: `/opt/render/project/src/data`
   - ✅ Size: 1GB

### Verify Database Path

The database should be at:
- **Path**: `/opt/render/project/src/data/analytics.db`
- **This is on the persistent disk** ✅

### After Adding Disk

1. **Redeploy** the service (to ensure it uses the disk)
2. **Add data** (it will now persist)
3. **Test** by redeploying again - data should still be there

## Check Current Status

**Quick Check:**
1. Visit https://puranalytics.com
2. Check if the week selector shows "Dec 4 - Dec 10, 2025"
3. If yes → Data exists! ✅
4. If no → Data was lost, need to re-add ❌

Let me know what you see, and I can help re-add the data if needed!
