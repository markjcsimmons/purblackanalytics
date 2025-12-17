# 🚀 Get Started with Pürblack Analytics

Your analytics dashboard is **ready to use!** The development server is already running at:

👉 **http://localhost:3000**

---

## ⚡ Quick Start (3 Steps)

### 1️⃣ Add Your OpenAI API Key

The app needs an OpenAI API key to generate AI insights.

**Option A: Get a New Key**
1. Visit: https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new secret key
4. Copy it

**Option B: Use Existing Key**
- If you already have an OpenAI API key, just grab it

**Configure the App:**
1. Open the file: `.env.local` (in the project root)
2. Replace `your_openai_api_key_here` with your actual key:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   ```
3. Save the file
4. Restart the dev server (Ctrl+C then `npm run dev`)

### 2️⃣ Upload Sample Data

To test the dashboard immediately:

1. Go to http://localhost:3000
2. Click the **"Upload Data"** tab
3. Select dates:
   - Start: Dec 4, 2024
   - End: Dec 10, 2024
4. Click **"Choose File"** and select `sample-data.csv` (in the project root)
5. Click **"Upload Data"**

✅ You should see: "Data uploaded successfully!"

### 3️⃣ Generate AI Insights

1. Go to the **"Overview"** tab
2. Your uploaded week will be selected automatically
3. Scroll down to "AI Insights & Recommendations"
4. Click **"Generate Insights"**
5. Wait 10-15 seconds for AI analysis
6. Review your personalized insights!

---

## 📊 Your Weekly Routine

Once set up, your weekly workflow is simple:

### Every Monday (or your preferred day):

1. **Collect Your Data**
   - Export data from Shopify, Google Ads, Meta Ads, etc.
   - Compile into a CSV file following the format (see below)

2. **Upload to Dashboard**
   - Go to "Upload Data" tab
   - Select the week dates
   - Upload your CSV
   - Click "Upload Data"

3. **Generate Insights**
   - Go to "Overview" tab
   - Click "Generate Insights"
   - Review AI recommendations
   - Share with your team

**Time Investment:** 5-10 minutes per week

---

## 📝 CSV Data Format

Your CSV needs exactly 4 columns:

```csv
Category,Subcategory,Metric,Value
```

### Categories & Their Metrics:

#### **Overall** (Store Performance)
```csv
Overall,Store,Total Revenue,48750
Overall,Store,Total Orders,125
Overall,Store,Conversion Rate,2.6
Overall,Store,Visitors,4800
Overall,Store,AOV,390
```

#### **Marketing** (Channel Performance)
```csv
Marketing,Meta Ads,Spend,6200
Marketing,Meta Ads,Revenue,18600
Marketing,Meta Ads,ROAS,3.0
Marketing,Google Ads,Spend,3800
Marketing,Google Ads,Revenue,11400
Marketing,Email & SMS,Revenue,8500
Marketing,Affiliates,Revenue,7200
Marketing,Organic Social,Revenue,2050
Marketing,SEO,Revenue,1000
```

#### **Funnel** (Website Conversion Path)
```csv
Funnel,Homepage,Visitors,4800
Funnel,Homepage,Bounce Rate,45
Funnel,Product Page,Visitors,2880
Funnel,Product Page,Add to Cart,650
Funnel,Cart,Visitors,650
Funnel,Checkout,Visitors,180
Funnel,Checkout,Orders Completed,125
```

### 💡 Tips:
- Use the provided `sample-data.csv` as a template
- Keep metric names consistent week-to-week
- Include all channels even if revenue is $0
- Values should be numbers only (no $ or % symbols)

---

## 🎯 What You Get from AI Insights

The AI will analyze your data and provide:

✅ **Performance Highlights**
- What's working exceptionally well
- Channels with strong ROI

⚠️ **Warnings & Issues**
- Underperforming channels
- Budget allocation concerns
- Declining metrics

💡 **Opportunities**
- Growth potential areas
- Optimization suggestions
- A/B test ideas

📋 **Specific Recommendations**
- Actionable next steps
- Budget reallocation advice
- Channel-specific tactics

Each insight is prioritized: **HIGH** | **MEDIUM** | **LOW**

---

## 🛠️ Customization Ideas

### Add Custom Metrics
Edit `components/data-upload.tsx` to parse additional CSV columns

### Change AI Model
In `lib/openai.ts`, change `gpt-4o` to:
- `gpt-4o-mini` - Faster, cheaper (75% cost reduction)
- `gpt-4-turbo` - Slightly older but reliable

### Add More Channels
Just add them to your CSV! The system auto-detects new channels:
```csv
Marketing,TikTok Ads,Spend,2000
Marketing,TikTok Ads,Revenue,6000
```

### Brand Colors
Edit `app/globals.css` to match your brand colors

---

## 💰 Cost Breakdown

### Monthly Operating Costs:

| Item | Cost | Notes |
|------|------|-------|
| Hosting (Dev) | $0 | Running locally |
| OpenAI API | $5-10 | ~$1-2 per weekly insight |
| **Total (Dev)** | **$5-10** | During testing |
| | | |
| Hosting (Production) | $0-20 | Vercel free tier or $20/mo |
| OpenAI API | $5-10 | Same as above |
| **Total (Prod)** | **$5-30** | For live deployment |

**vs. Hiring an analyst:** $3,000-8,000/month 💰

---

## 🚀 Going to Production

When ready to deploy publicly:

### Option 1: Vercel (Easiest)
1. Push code to GitHub
2. Import to Vercel
3. Add `OPENAI_API_KEY` env variable
4. Deploy! (Free for hobby use)

**Note:** Switch from SQLite to PostgreSQL for production

### Option 2: Your Own Server
- Use DigitalOcean, AWS, or Render
- Costs $5-20/month
- Full control

See `README.md` for detailed deployment instructions.

---

## ❓ Troubleshooting

### "Failed to generate insights"
- Check your OpenAI API key in `.env.local`
- Restart dev server: Ctrl+C then `npm run dev`
- Check you have API credits at platform.openai.com

### "Upload failed"
- Verify CSV has correct headers: Category, Subcategory, Metric, Value
- Ensure Value column has numbers only
- Check for special characters in text

### Database errors
- Stop server (Ctrl+C)
- Delete `data/` folder
- Restart: `npm run dev`

### Server won't start
- Kill any process on port 3000: `lsof -ti:3000 | xargs kill`
- Try: `npm run dev`

---

## 📚 Additional Resources

- **Full Documentation:** See `README.md`
- **Setup Guide:** See `SETUP.md`
- **Sample Data:** Use `sample-data.csv`

---

## 🎉 You're All Set!

Your dashboard is running and ready to transform your marketing data into actionable insights.

**Next Steps:**
1. Add your OpenAI API key
2. Upload the sample data
3. Generate your first insights
4. Start your weekly routine!

Questions? Check the docs or reach out to your dev team.

**Happy analyzing! 📊✨**



