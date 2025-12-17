# Add OpenAI API Key to Render - Step by Step

## Your API Key

Your OpenAI API key from `.env.local` is:
```
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
```

## Steps to Add to Render

### Step 1: Go to Environment Settings

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click on your service: **puranalytics**

2. **Click "Environment"**
   - In the left sidebar, click **"Environment"**
   - OR look for "Environment Variables" section

### Step 2: Add the Environment Variable

1. **Scroll to "Environment Variables" Section**
   - You'll see a list of existing environment variables
   - Look for: `NODE_ENV`, `NODE_VERSION`, `SITE_PASSWORD`

2. **Click "Add Environment Variable"**
   - Button is usually at the top or bottom of the environment variables list

3. **Fill in the Form:**
   - **Key**: `OPENAI_API_KEY`
     - Type exactly: `OPENAI_API_KEY` (all caps, underscores)
   - **Value**: `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`
     - Copy the entire key (starts with `sk-proj-`)

4. **Click "Save Changes"**
   - Render will automatically redeploy your service
   - Wait 2-3 minutes for deployment

### Step 3: Verify It's Set

1. **Check the Environment Variables List**
   - You should see `OPENAI_API_KEY` in the list
   - Value will show as `••••••••` (hidden for security)

2. **Check Deployment Status**
   - Go to "Events" or "Logs" tab
   - Look for successful deployment
   - Should complete without errors

### Step 4: Test Insights Generation

1. **Go to Your Site**
   - Visit: https://puranalytics.com
   - Log in

2. **Generate Insights**
   - Go to "Overview" tab
   - Select your week (Dec 4-10, 2025)
   - Scroll to "AI Insights & Recommendations"
   - Click "Generate Insights" or "Regenerate"
   - Should work now! ✅

## Troubleshooting

### If "Add Environment Variable" Button Not Visible

- Make sure you're in the **"Environment"** tab
- Scroll down to find the environment variables section
- Look for a "+" button or "Add" button

### If Key Already Exists

- If `OPENAI_API_KEY` is already in the list:
  - Click on it to edit
  - Update the value with the key above
  - Save changes

### If Deployment Fails

- Check the "Logs" tab for errors
- Verify the API key format (should start with `sk-proj-`)
- Make sure there are no extra spaces

### If Insights Still Fail After Adding Key

1. **Check Render Logs**
   - Go to "Logs" tab
   - Look for errors mentioning:
     - `OPENAI_API_KEY`
     - `generateInsights`
     - `Failed to generate insights`

2. **Verify API Key is Valid**
   - Go to https://platform.openai.com/api-keys
   - Check if the key is active
   - Generate a new one if needed

3. **Check OpenAI Account**
   - Verify you have credits/quota
   - Check billing at https://platform.openai.com/account/billing

## Quick Checklist

- [ ] `OPENAI_API_KEY` is added to Render environment variables
- [ ] Value is the full key (starts with `sk-proj-`)
- [ ] Service has been redeployed after adding
- [ ] Deployment completed successfully
- [ ] OpenAI account has credits/quota

After completing these steps, insights generation should work! 🎯
