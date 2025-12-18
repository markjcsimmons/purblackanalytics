# URGENT: Rename Environment Variable in Render

## The Problem

Your environment variable is named `OPEN_AI_KEY` but the code is looking for `OPENAI_API_KEY`.

## Quick Fix (2 minutes)

### Step 1: Go to Render Environment Settings

1. Go to: https://dashboard.render.com
2. Click on **puranalytics** service
3. Click **"Environment"** in left sidebar

### Step 2: Edit the Variable Name

1. Find `OPEN_AI_KEY` in the environment variables list
2. Click on it (or click "Edit" button)
3. Change the **KEY** field from:
   - `OPEN_AI_KEY` ❌
   - To: `OPENAI_API_KEY` ✅
4. Keep the **VALUE** exactly the same (your API key)
5. Click **"Save Changes"**

### Step 3: Wait for Redeploy

- Render will automatically redeploy (2-3 minutes)
- Wait for deployment to complete

### Step 4: Test

1. Go to https://puranalytics.com
2. Log in
3. Overview → Select your week
4. Click "Generate Insights"
5. Should work now! ✅

---

## Why This Happens

The code checks for `process.env.OPENAI_API_KEY` (no space), but your variable is `OPEN_AI_KEY` (with space). JavaScript environment variable names are case-sensitive and must match exactly.

---

**This is a 2-minute fix - just rename the variable in Render!** 🎯
