# Fix "Failed to generate insights" Error

## Most Common Cause: Missing OpenAI API Key

The error usually occurs because the `OPENAI_API_KEY` environment variable is not set in your Render dashboard.

## Solution: Add OpenAI API Key to Render

### Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Log in to your OpenAI account
3. Click **"Create new secret key"**
4. Copy the API key (starts with `sk-...`)
5. **Important**: Save it somewhere safe - you won't be able to see it again!

### Step 2: Add to Render Dashboard

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click on your service: **puranalytics**

2. **Add Environment Variable**
   - In the left sidebar, click **"Environment"**
   - Scroll down to **"Environment Variables"** section
   - Click **"Add Environment Variable"**
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Paste your OpenAI API key (the `sk-...` key you copied)
   - Click **"Save Changes"**

3. **Redeploy Service**
   - After adding the environment variable, Render will automatically redeploy
   - OR manually trigger: **Manual Deploy** → **Deploy latest commit**
   - Wait for deployment to complete (2-3 minutes)

### Step 3: Test Insights Generation

1. Go to https://puranalytics.com
2. Log in
3. Go to **"Overview"** tab
4. Select your week (Dec 4-10, 2025)
5. Scroll to **"AI Insights & Recommendations"** section
6. Click **"Generate Insights"** or **"Regenerate"**
7. Should work now! ✅

---

## Other Possible Issues

### Issue 2: API Key Format Error

**Error**: "Invalid API key format"

**Solution**:
- Make sure the API key starts with `sk-`
- No extra spaces or quotes
- Copy the entire key

### Issue 3: API Key Invalid/Expired

**Error**: "Incorrect API key provided"

**Solution**:
- Generate a new API key from OpenAI
- Update it in Render dashboard
- Redeploy

### Issue 4: OpenAI API Rate Limit

**Error**: "Rate limit exceeded" or "You exceeded your current quota"

**Solution**:
- Check your OpenAI account billing/usage
- Add payment method if needed
- Wait a few minutes and try again

### Issue 5: Network/Connection Error

**Error**: "Failed to fetch" or timeout

**Solution**:
- Check Render service is running (not sleeping)
- Check OpenAI API status: [status.openai.com](https://status.openai.com)
- Try again in a few minutes

---

## Verify Environment Variable is Set

To verify the key is set correctly:

1. In Render dashboard → Your service → **Environment** tab
2. Look for `OPENAI_API_KEY` in the list
3. It should show `••••••••` (hidden for security)
4. If it's not there, add it following Step 2 above

---

## Check Render Logs for Detailed Error

If the error persists:

1. Go to Render dashboard → Your service
2. Click **"Logs"** tab
3. Look for error messages related to:
   - `OPENAI_API_KEY`
   - `generateInsights`
   - `Failed to generate insights`
4. The logs will show the exact error message

---

## Quick Checklist

- [ ] OpenAI API key is created and copied
- [ ] `OPENAI_API_KEY` is added to Render environment variables
- [ ] Service has been redeployed after adding the key
- [ ] OpenAI account has credits/quota available
- [ ] Service is running (not sleeping)

---

## Still Not Working?

If you've checked all the above and it still fails:

1. **Check Render Logs** for the exact error message
2. **Share the error message** from the browser console (F12 → Console tab)
3. **Verify API key** by testing it directly:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

The most common fix is simply adding the `OPENAI_API_KEY` environment variable in Render! 🎯
