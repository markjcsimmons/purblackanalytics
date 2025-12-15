# Google Docs Import Feature

## Overview

In addition to CSV uploads, you can now **paste data directly from your Google Docs weekly reports**. The system intelligently parses your document structure and extracts all metrics automatically.

## How It Works

### Step 1: Open Your Google Doc

Open your weekly marketing report in Google Docs (like the one at https://docs.google.com/document/d/1-V6WHD8vLF-xwyfWXwilvnSXOkbIeR_s73irXYJtzrs/edit)

### Step 2: Copy Everything

1. Click inside the document
2. Press `Cmd+A` (Mac) or `Ctrl+A` (Windows) to select all
3. Press `Cmd+C` (Mac) or `Ctrl+C` (Windows) to copy

### Step 3: Paste into Dashboard

1. Go to your Purblack Analytics dashboard
2. Click **"Upload Data"** tab
3. Click **"Google Docs"** tab
4. Paste (`Cmd+V` or `Ctrl+V`) into the large text area
5. Select your week start and end dates
6. Click **"Import Data"**

That's it! The parser will automatically:
- Detect sections (Overall, Marketing, Funnel)
- Find marketing channels (Meta Ads, Google Ads, Email/SMS, etc.)
- Extract all metrics and values
- Upload to your database

## Supported Format

The parser is **flexible** and supports multiple formats:

### Format 1: Colon-Separated
```
Revenue: $45,000
Orders: 120
Conversion Rate: 2.5%
```

### Format 2: Tab or Space-Separated
```
Revenue         $45,000
Orders          120
Conversion Rate 2.5%
```

### Format 3: Multi-line
```
Revenue
$45,000

Orders
120
```

## What Gets Parsed

### Overall Store Performance

Any section with "Overall" or "Key Metrics" in the header:

```
Overall Store Performance
Revenue: $45,000
Orders: 120
Conversion Rate: 2.5%
Visitors: 4,800
```

**Becomes:**
- Overall Metric: Revenue = 45000
- Overall Metric: Orders = 120
- Overall Metric: Conversion Rate = 2.5
- Overall Metric: Visitors = 4800

### Marketing Channels

Any section with "Marketing" in the header, with subsections for each channel:

```
Marketing Channels

Meta Ads
Spend: $5,000
Revenue: $15,000
ROAS: 3.0

Google Ads
Spend: $3,000
Revenue: $9,000
```

**Becomes:**
- Marketing > Meta Ads > Spend = 5000
- Marketing > Meta Ads > Revenue = 15000
- Marketing > Meta Ads > ROAS = 3.0
- Marketing > Google Ads > Spend = 3000
- Marketing > Google Ads > Revenue = 9000

### Recognized Channels:
- Meta Ads / Facebook Ads
- Google Ads
- Email & SMS / Klaviyo
- Affiliates / Impact
- Organic Social
- SEO

### Website Funnel

Any section with "Funnel" in the header:

```
Website Funnel Analytics

Homepage
Visitors: 4,800
Bounce Rate: 45%

Product Page
Visitors: 2,880
Add to Cart: 650

Cart
Visitors: 650
Checkout Initiated: 180

Checkout
Orders Completed: 125
```

**Becomes:**
- Funnel > Homepage > Visitors = 4800
- Funnel > Homepage > Bounce Rate = 45
- Funnel > Product Page > Visitors = 2880
- Funnel > Product Page > Add to Cart = 650
- And so on...

## Formatting Tips

### ✅ Works Great:
- Numbers with commas: `$45,000` → 45000
- Percentages: `2.5%` → 2.5
- Dollar signs: `$5000` → 5000
- Various spacing/formatting from Google Docs
- Bullet points, numbered lists
- Headers at any level

### ⚠️ May Need Adjustment:
- Text in the value field: `Revenue: Five Thousand` (won't parse)
- Dates as values: `Date: Dec 10` (not a metric)
- Mixed text and numbers: `Orders: 120 orders` (will extract 120)

## Example Google Doc Structure

```
04.12 - 10.12 Week

1. Overall Store Performance
   Key metrics of the week

   Total Revenue: $48,750
   Total Orders: 125
   Conversion Rate: 2.6%
   Visitors: 4,800
   AOV: $390

2. Marketing Channels

   2.1 Meta Ads
   Spend: $6,200
   Revenue: $18,600
   ROAS: 3.0
   Clicks: 1,240

   2.2 Google Ads
   Spend: $3,800
   Revenue: $11,400
   ROAS: 3.0

   2.3 Email & SMS (Klaviyo)
   Spend: $500
   Revenue: $8,500
   ROAS: 17.0

   2.4 Affiliates (Impact)
   Commission: $1,200
   Revenue: $7,200

   2.5 Organic Social
   Revenue: $2,050

   2.6 SEO
   Revenue: $1,000

3. Website Funnel Analytics

   Homepage
   Visitors: 4,800
   Bounce Rate: 45%

   Product Pages
   Visitors: 2,880
   Add to Cart Rate: 22.6%

   Cart
   Visitors: 650
   Checkout Initiated: 180

   Checkout
   Orders Completed: 125
```

## Troubleshooting

### "Could not parse any data"

**Cause:** The parser didn't recognize any section headers or metrics.

**Solution:**
1. Make sure you have section headers with keywords:
   - "Overall" or "Performance"
   - "Marketing" or "Channels"
   - "Funnel" or "Analytics"
2. Ensure metrics have values (numbers) on the same or next line
3. Try adding clearer headers like "Overall Store Performance"

### Missing Some Metrics

**Cause:** Metric format wasn't recognized.

**Solution:**
1. Check that values are numbers (not text)
2. Put metrics on one line: `Revenue: $5,000`
3. Or on two lines:
   ```
   Revenue
   $5,000
   ```
4. Avoid complex formatting in the metric value

### Wrong Channel Assignment

**Cause:** Channel name wasn't recognized.

**Solution:**
1. Use standard channel names:
   - "Meta Ads" or "Facebook Ads"
   - "Google Ads"
   - "Email & SMS" or "Klaviyo"
   - "Affiliates" or "Impact"
   - "Organic Social"
   - "SEO"
2. Make them headers/subheaders in the Marketing section

### Values Are Incorrect

**Cause:** Parser extracted the wrong number.

**Solution:**
1. Remove extra text near numbers: "Revenue: $5,000 USD" → "Revenue: $5,000"
2. Use standard number format: 5,000 or 5000 (both work)
3. Check success message - it tells you how many metrics were found

## Success Message

After import, you'll see a message like:

```
✓ Data uploaded successfully! Week ID: 123. 
  Found 5 overall metrics, 6 channels, and 4 funnel stages.
```

This confirms:
- Upload worked
- How many items were detected in each category

If numbers seem low, review your doc format and try again.

## Comparing with CSV Upload

| Feature | Google Docs | CSV |
|---------|-------------|-----|
| **Ease of Use** | ⭐⭐⭐⭐⭐ Just copy/paste | ⭐⭐⭐⭐ Need to format |
| **Flexibility** | ⭐⭐⭐⭐⭐ Any format works | ⭐⭐⭐ Must follow template |
| **Speed** | ⭐⭐⭐⭐⭐ 30 seconds | ⭐⭐⭐⭐ 2-3 minutes |
| **Accuracy** | ⭐⭐⭐⭐ Usually good | ⭐⭐⭐⭐⭐ 100% precise |
| **Best For** | Weekly reports | Automated exports |

## Recommended Workflow

### Option 1: Google Docs (Recommended)
Perfect if you already write weekly reports in Google Docs.

1. Write your weekly report as you normally do
2. Copy & paste into dashboard
3. Generate insights
4. Total time: **< 1 minute**

### Option 2: CSV
Perfect if you export data from tools automatically.

1. Export data from Shopify, Google Ads, etc.
2. Format as CSV
3. Upload to dashboard
4. Total time: **2-3 minutes**

### Option 3: Hybrid
Use both!
- Google Docs for quick weekly updates
- CSV for monthly comprehensive reports

## Tips for Best Results

1. **Use Clear Headers**
   - "Overall Store Performance" ✅
   - "Marketing Channels" ✅
   - "Channel Performance" ✅

2. **Consistent Formatting**
   - Keep the same metric names each week
   - Use the same channel names
   - Format numbers the same way

3. **Include All Channels**
   - Even if revenue is $0, include the channel
   - Helps with trend analysis over time

4. **Check the Success Message**
   - Verify the number of metrics found
   - If lower than expected, review and re-import

5. **Use Both Methods**
   - Quick paste from Google Docs for weekly updates
   - Precise CSV for important monthly reports

## Support

If you have issues:
1. Check the troubleshooting section above
2. Review your Google Doc format
3. Try the CSV upload method as backup
4. The CSV format guide is in the dashboard

## Future Enhancements

Coming soon:
- Direct Google Docs API integration (no copy/paste needed)
- Auto-detect week dates from document
- Support for Google Sheets
- Slack integration for automated imports

---

**Questions?** See the main README.md or SETUP.md for more help.

