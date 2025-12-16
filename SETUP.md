# Quick Setup Guide for Purblack Analytics

Follow these steps to get your analytics dashboard up and running in 5 minutes.

## Step 1: Configure API Key

1. Get your OpenAI API key from: https://platform.openai.com/api-keys
2. Copy the `.env.local` file template that was created
3. Replace `your_openai_api_key_here` with your actual API key:
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   ```

## Step 2: Start the Development Server

Open your terminal in the project directory and run:

```bash
npm run dev
```

The dashboard will be available at: **http://localhost:3000**

## Step 3: Upload Your First Week of Data

1. Open the dashboard in your browser
2. Click on the "Upload Data" tab
3. Select the week start and end dates
4. Use the provided `sample-data.csv` file to test, or create your own following the format guide
5. Click "Upload Data"

## Step 4: Generate AI Insights

1. After uploading, go to the "Overview" tab
2. Your uploaded week will be automatically selected
3. Click "Generate Insights" to get AI-powered recommendations
4. Review the insights, which are prioritized by impact level

## CSV Data Format

Your weekly data should be in CSV format with 4 columns:

```csv
Category,Subcategory,Metric,Value
Overall,Store,Total Revenue,45000
Marketing,Meta Ads,Spend,5000
Funnel,Homepage,Visitors,4800
```

### Categories Explained:

**Overall** - Store-wide performance
- Revenue, Orders, Conversion Rate, Visitors, AOV (Average Order Value)

**Marketing** - Channel performance (Subcategory = Channel Name)
- Meta Ads: Spend, Revenue, ROAS, Clicks, CPC
- Google Ads: Spend, Revenue, ROAS, Clicks, CPC
- Email & SMS: Spend, Revenue, Opens, Clicks
- Affiliates: Commission, Revenue
- Organic Social: Revenue
- SEO: Revenue

**Funnel** - Website conversion funnel (Subcategory = Stage Name)
- Homepage: Visitors, Bounce Rate
- Product Page: Visitors, Add to Cart
- Cart: Visitors, Checkout Initiated
- Checkout: Visitors, Orders Completed

## Tips for Best Results

1. **Consistent Data**: Upload data weekly on the same day
2. **Complete Metrics**: Include all available metrics for better AI insights
3. **Historical Data**: Upload past weeks to see trend analysis
4. **Review Insights**: Check insights weekly to track improvements

## Common Issues

### "Failed to generate insights"
- Check your OpenAI API key in `.env.local`
- Verify you have API credits available
- Restart the development server after changing `.env.local`

### "Upload failed"
- Ensure CSV has correct column headers (Category, Subcategory, Metric, Value)
- Check that Value column contains only numbers
- Remove any special characters from text fields

### Database errors
- Delete the `data/` folder to reset the database
- Make sure the application has write permissions in the project folder

## Next Steps

1. **Customize Metrics**: Add your specific KPIs to the CSV format
2. **Set Up Production**: Deploy to Vercel for always-on access
3. **Schedule Uploads**: Create a weekly routine to upload data
4. **Share Insights**: Export or share AI recommendations with your team

## Need Help?

- Check the full README.md for detailed documentation
- Review the sample-data.csv for format examples
- Contact your development team for support

---

**Ready?** Just run `npm run dev` and start tracking your marketing performance! 🚀



