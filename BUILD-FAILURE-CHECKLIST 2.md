# Build Failure Troubleshooting Checklist

## 🔍 **CRITICAL: Get the Exact Error Message**

1. **Check Render Build Logs**
   - Go to Render Dashboard → Your Service → Deployments → Click on failed deployment
   - Scroll to find the **exact error message** (not just "Exited with status 1")
   - Look for lines that say:
     - `Error: Failed to collect page data for...`
     - `Module not found:...`
     - `Type error:...`
     - `Cannot find module...`
   - **Copy the FULL error message** - this is the most important step!

---

## 📋 **Configuration Checklist**

### 1. **render.yaml Configuration**
- [ ] File exists in root directory
- [ ] YAML syntax is valid (no tabs, proper indentation)
- [ ] `plan: starter` is set (required for persistent disks)
- [ ] `buildCommand: npm install && npm run build`
- [ ] `startCommand: npm start`
- [ ] `NODE_VERSION` environment variable is set to `"20"`
- [ ] Disk configuration is correct:
  ```yaml
  disk:
    name: sqlite-data
    mountPath: /opt/render/project/src/data
    sizeGB: 1
  ```

### 2. **package.json Verification**
- [ ] All dependencies are listed (check for missing packages)
- [ ] `engines.node` is set to `">=20.0.0"`
- [ ] Build script: `"build": "next build"`
- [ ] Start script: `"start": "next start"`
- [ ] Verify these dependencies exist:
  - `next: "16.0.10"`
  - `better-sqlite3: "^11.8.1"`
  - `styled-jsx: "^5.1.7"`
  - All `@radix-ui` packages
  - `tailwind-merge`, `clsx`, `class-variance-authority`

### 3. **Next.js Configuration (next.config.ts)**
- [ ] File exists and exports a valid config
- [ ] No syntax errors
- [ ] `reactStrictMode: true` is set

### 4. **API Routes Configuration**
- [ ] All API routes have `export const dynamic = 'force-dynamic'`
- [ ] All API routes have `export const runtime = 'nodejs'`
- [ ] Routes using database use dynamic imports: `await import('@/lib/db')`
- [ ] Check these routes:
  - `/app/api/insights/route.ts`
  - `/app/api/weeks/route.ts`
  - `/app/api/weeks/[id]/route.ts`
  - `/app/api/upload/route.ts`
  - `/app/api/auth/check/route.ts`
  - `/app/api/auth/login/route.ts`
  - `/app/api/auth/logout/route.ts`
  - `/app/api/fetch-google-doc/route.ts`

### 5. **Database Module (lib/db.ts)**
- [ ] Uses lazy loading with `require()` not top-level `import`
- [ ] No database initialization at module level
- [ ] `getDb()` function only initializes when called (not during import)

### 6. **Environment Variables**
- [ ] `NODE_ENV=production` is set in render.yaml
- [ ] `NODE_VERSION=20` is set in render.yaml
- [ ] `SITE_PASSWORD` is set (or will be set manually in dashboard)
- [ ] `OPENAI_API_KEY` is set (manually in dashboard, `sync: false`)

### 7. **Build Files**
- [ ] `.npmrc` exists with `build-from-source=false`
- [ ] `.nvmrc` exists with `20`
- [ ] `.gitignore` doesn't exclude necessary files
- [ ] `package-lock.json` is committed to git

---

## 🛠️ **Alternative Solutions to Try**

### Option 1: **Manual Deployment (Skip render.yaml)**
If `render.yaml` is causing issues, deploy manually:
1. Delete or rename `render.yaml` temporarily
2. Go to Render Dashboard → New → Web Service
3. Connect GitHub repo
4. Configure manually:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Starter
   - Add environment variables in dashboard
   - Add persistent disk after service is created

### Option 2: **Simplify Database Access**
If database is still causing issues, try:
1. Comment out all database calls in API routes temporarily
2. Deploy to see if build succeeds
3. If it does, the issue is database-related
4. If it doesn't, the issue is elsewhere

### Option 3: **Check for TypeScript Errors**
Run locally:
```bash
npm run build
```
- [ ] Does it build successfully locally?
- [ ] Are there any TypeScript errors?
- [ ] Are there any linting errors?

### Option 4: **Verify Node.js Version**
- [ ] Check Render is using Node 20
- [ ] In Render dashboard, check "Environment" section
- [ ] Verify `NODE_VERSION=20` is actually being used

### Option 5: **Check Disk Mount**
- [ ] Persistent disk is created in Render dashboard
- [ ] Mount path matches: `/opt/render/project/src/data`
- [ ] Disk size is at least 1GB
- [ ] Service is on Starter plan (required for disks)

---

## 🔎 **Common Error Patterns & Solutions**

### Error: "Failed to collect page data for /api/..."
**Solution:**
- Ensure route has `export const dynamic = 'force-dynamic'`
- Use dynamic imports for database: `await import('@/lib/db')`
- Check database module doesn't initialize at import time

### Error: "Module not found: ..."
**Solution:**
- Add missing package to `package.json`
- Run `npm install` locally and commit `package-lock.json`
- Check `node_modules` is not in `.gitignore`

### Error: "Cannot find module 'better-sqlite3'"
**Solution:**
- Verify `better-sqlite3` is in `dependencies` (not `devDependencies`)
- Check `.npmrc` has `build-from-source=false`
- Ensure Node.js 20 is being used

### Error: "Type error: ..."
**Solution:**
- Fix TypeScript errors locally first
- Run `npm run build` locally to catch errors
- Check all type definitions are correct

### Error: Build timeout or memory issues
**Solution:**
- Upgrade to Starter plan (you're already on it)
- Simplify build process
- Check for circular dependencies

---

## 📝 **Debugging Steps**

1. **Get the exact error:**
   ```bash
   # Check Render build logs for the FULL error message
   ```

2. **Test build locally:**
   ```bash
   cd /path/to/project
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **Check git status:**
   ```bash
   git status
   git log --oneline -5  # Check recent commits
   ```

4. **Verify all files are committed:**
   ```bash
   git ls-files | grep -E "(render.yaml|package.json|next.config)"
   ```

5. **Check for syntax errors:**
   ```bash
   # YAML syntax
   cat render.yaml
   
   # TypeScript
   npx tsc --noEmit
   ```

---

## 🚨 **If Nothing Works**

1. **Share the exact error message** from Render build logs
2. **Try deploying without render.yaml** (manual setup)
3. **Consider using a different database** (PostgreSQL/Supabase) if SQLite continues to cause issues
4. **Check Render status page** for service outages
5. **Contact Render support** with:
   - Your service name
   - Failed deployment ID
   - Full error logs
   - Your render.yaml content

---

## ✅ **Quick Verification Command**

Run this locally to verify everything is correct:
```bash
# Clean install
rm -rf .next node_modules package-lock.json
npm install

# Type check
npx tsc --noEmit

# Build
npm run build

# If all succeed, the issue is likely Render-specific
```

---

**NEXT STEP:** Get the exact error message from Render build logs and share it for targeted troubleshooting.
