# Fix: Rename Environment Variable

## The Problem

Your environment variable is named `OPEN_AI_KEY` but the code is looking for `OPENAI_API_KEY`.

## Solution: Rename in Render

### Option 1: Edit the Existing Variable (Recommended)

1. **Go to Render Dashboard**
   - https://dashboard.render.com
   - Click on **puranalytics** service

2. **Go to Environment Tab**
   - Click **"Environment"** in left sidebar

3. **Edit the Variable**
   - Find `OPEN_AI_KEY` in the list
   - Click on it to edit (or click the "Edit" button)
   - Change the **KEY** from `OPEN_AI_KEY` to `OPENAI_API_KEY`
   - Keep the **VALUE** the same (your API key)
   - Click **"Save Changes"**

4. **Delete the Old One** (if it doesn't auto-replace)
   - If both exist, delete `OPEN_AI_KEY`
   - Keep only `OPENAI_API_KEY`

### Option 2: Add New + Delete Old

1. **Add New Variable**
   - Click **"Add Environment Variable"**
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Copy the value from `OPEN_AI_KEY`
   - Click **"Save"**

2. **Delete Old Variable**
   - Find `OPEN_AI_KEY`
   - Delete it (trash icon or delete button)

3. **Redeploy**
   - Render will auto-redeploy
   - Wait 2-3 minutes

## After Fixing

1. **Test Insights Generation**
   - Go to https://puranalytics.com
   - Log in
   - Go to Overview → Select your week
   - Click "Generate Insights"
   - Should work now! ✅

## Quick Reference

**Current (Wrong):**
- Key: `OPEN_AI_KEY` ❌

**Should Be:**
- Key: `OPENAI_API_KEY` ✅
- Value: (same API key value)

The code looks for `process.env.OPENAI_API_KEY`, so the name must match exactly!
