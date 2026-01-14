# How to Add Persistent Disk for SQLite on Render

Your SQLite database is stored in the `data/` folder. To make it persist across deployments, you need to attach a persistent disk.

## Step-by-Step Instructions

### Option 1: Using Render Dashboard (Recommended)

1. **Deploy your service first** (without disk initially is fine for testing)

2. **Go to your service in Render Dashboard**:
   - Click on your service name (e.g., "puranalytics")

3. **Navigate to Disks section**:
   - In the left sidebar, click **"Disks"**
   - Or scroll down to find the "Disks" section

4. **Click "Attach Persistent Disk"**:
   - You'll see a button/option to attach a new disk

5. **Configure the disk**:
   - **Name**: `sqlite-data` (or any name you prefer)
   - **Mount Path**: `/opt/render/project/src/data`
     - ⚠️ **Important**: This is Render's project path + your `data/` folder
   - **Size**: Start with **1 GB** (minimum, you can increase later if needed)

6. **Click "Attach"** to create the disk

7. **Redeploy your service**:
   - The disk will be available after the next deployment
   - Click "Manual Deploy" → "Deploy latest commit"

### Option 2: Using render.yaml (Auto-configuration)

If you're using the `render.yaml` file I created, the disk configuration is already included:

```yaml
disk:
  name: sqlite-data
  mountPath: /opt/render/project/src/data
  sizeGB: 1
```

When you create the service using this YAML file (via Blueprint), Render will automatically create the disk.

## Important Path Information

Your code uses:
```typescript
const dbPath = path.join(process.cwd(), 'data', 'analytics.db');
```

On Render:
- `process.cwd()` = `/opt/render/project/src`
- So the full path becomes: `/opt/render/project/src/data/analytics.db`

This matches the mount path: `/opt/render/project/src/data`

## Verifying It Works

After deployment with persistent disk:

1. **Add some data** through your app
2. **Redeploy** the service
3. **Check that your data is still there** after redeployment
4. If data persists, the disk is working correctly! ✅

## Troubleshooting

**If database is empty after redeployment:**
- Verify the mount path is exactly: `/opt/render/project/src/data`
- Check that the disk is attached in the Disks section
- Ensure the disk shows "Attached" status

**If you see errors about database file:**
- The disk might not be mounted correctly
- Double-check the mount path matches exactly
- Try redeploying the service

## Cost

- **Free tier**: Includes persistent disks (limited size)
- **Starter plan ($7/month)**: More disk space available

The 1GB disk should be plenty for your SQLite database unless you're storing massive amounts of historical data.
