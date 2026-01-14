# 🎯 Context-Aware AI Insights Feature

## Overview

The dashboard now includes a comprehensive **context system** that allows you to provide business context to the AI, ensuring insights are accurate and relevant to your specific situation.

## Problem Solved

**Before:** AI saw a 58% conversion rate drop and flagged it as a major problem, without knowing that the previous week had a Black Friday sale with abnormally high metrics.

**After:** AI receives context like "Previous week had Black Friday sale - metrics were expected to be higher than normal" and provides insights that account for this context.

---

## 🎯 Three Levels of Context

### 1. **Week Notes** (During Data Upload)
When uploading data (CSV or Google Docs), you can add notes about that specific week:

**Examples:**
- "Black Friday sale week - all week 30% off sitewide"
- "Website redesign launched on Tuesday"
- "Server outage on Monday for 3 hours"
- "Launched new peptide product line"

**Where to add:** Both CSV upload and Google Docs import forms now have a "Week Context / Notes" field.

### 2. **Additional Context** (When Generating Insights)
When clicking "Generate Insights", you can click "Add Context" to provide additional information:

**Examples:**
- "Focus on Google Ads performance - we increased budget by 50%"
- "Ignore Meta Ads - campaign was paused for optimization"
- "Email campaign launched mid-week targeting abandoned carts"
- "Compare this week to 2 weeks ago, not last week (Black Friday skews data)"

**Where to add:** Click the "Add Context" button next to "Generate Insights"

### 3. **Previous Week Comparison** (Automatic)
The system automatically compares current week to previous week metrics for trend analysis.

---

## 🔧 How It Works

1. **Data Upload:**
   ```
   User uploads data for Dec 4-10
   + Week Notes: "Black Friday sale week"
   ```

2. **Generate Insights:**
   ```
   User clicks "Add Context" 
   + Additional Context: "Previous week had 30% off sale, 
   so drops are expected return to normal"
   ```

3. **AI Analysis:**
   ```
   OpenAI receives:
   - All metrics (revenue, orders, channels, funnel)
   - Week notes: "Black Friday sale week"
   - Additional context: "Previous week had 30% off sale..."
   - Previous week data for comparison
   
   AI understands:
   ✅ Drops are normal post-sale
   ✅ Focus on real issues, not expected changes
   ✅ Provide actionable insights for normal operations
   ```

---

## 📋 Best Practices

### When Uploading Data
**DO include context about:**
- ✅ Major promotions or sales
- ✅ Technical issues (outages, bugs)
- ✅ New product launches
- ✅ Marketing campaign changes
- ✅ Seasonal events
- ✅ Website changes or A/B tests

**DON'T include:**
- ❌ General observations about the data (AI will see that)
- ❌ Questions (use the insights results for that)
- ❌ Extremely long explanations (keep it concise)

### When Generating Insights
**DO add additional context when:**
- ✅ You want AI to focus on specific areas
- ✅ You want to clarify unusual circumstances
- ✅ You want to override week-to-week comparisons
- ✅ You have information not captured in week notes

**DON'T add context if:**
- ❌ Week notes already explain everything
- ❌ It's a normal operational week with no special events

---

## 💡 Example Use Cases

### Use Case 1: Post-Promotion Analysis
```
Week Notes: "Black Friday - 30% off sitewide, ran Nov 24-27"

Additional Context: "Revenue dropped 77% vs last week, but this 
is expected return to baseline. Focus on conversion rate drop 
which seems abnormal even accounting for the sale ending."

Result: AI focuses on the conversion rate issue, acknowledges 
revenue drop as expected, provides actionable recommendations.
```

### Use Case 2: Campaign Test Week
```
Week Notes: "Testing new Google Ads campaign structure - 
migrated from single campaign to campaign-per-product"

Additional Context: "Spend increase in Google Ads was 
intentional to gather data. Evaluate ROAS and CPA trends."

Result: AI evaluates campaign efficiency rather than flagging 
spend increase as a problem.
```

### Use Case 3: Technical Issues
```
Week Notes: "Site down Monday 2-5 PM EST due to hosting issues. 
Lost ~3 hours of prime shopping time."

Additional Context: "When analyzing conversion rate and 
revenue, account for 12.5% time loss. What's the real 
performance excluding downtime?"

Result: AI adjusts analysis to account for downtime, provides 
normalized metrics.
```

---

## 🔄 Updated Workflow

### Old Workflow:
1. Upload data
2. Generate insights
3. ❌ Get irrelevant insights due to lack of context
4. Manually reinterpret insights

### New Workflow:
1. Upload data **+ Week notes**
2. Generate insights **+ Additional context (optional)**
3. ✅ Get accurate, context-aware insights
4. Act on recommendations immediately

---

## 🎨 UI Features

### Data Upload Forms
- **CSV Upload:** New "Week Context / Notes" textarea
- **Google Docs Import:** New "Week Context / Notes" textarea
- Both include helpful placeholder examples

### Insights Section
- **"Add Context" button:** Toggleable context input
- **"Hide Context" button:** Collapse when not needed
- **Helpful examples:** Shows common use cases
- **Note indicator:** Reminds users context is combined with week notes

---

## 🔐 Data Storage

**Week Notes:**
- Stored in database with week data
- Persists across sessions
- Sent to AI every time insights are generated for that week

**Additional Context:**
- Not stored (session-only)
- Only used for that specific insight generation
- Allows flexible, one-time context without cluttering database

---

## 🚀 Benefits

1. **More Accurate Insights**
   - AI understands your business context
   - Reduces false alarms
   - Focuses on real issues

2. **Saves Time**
   - No need to reinterpret insights
   - AI does the heavy lifting
   - Actionable recommendations immediately

3. **Better Decision Making**
   - Context-aware analysis
   - Accounts for special circumstances
   - Compares apples to apples

4. **Flexible**
   - Add context at upload or generation
   - Optional - only when needed
   - Works with both CSV and Google Docs

---

## 🎯 Next Steps

1. **Re-upload your Dec 4-10 data** with context:
   ```
   Week Notes: "Previous week (Nov 27 - Dec 3) had Black Friday 
   sale all week with 30% off sitewide. This week (Dec 4-10) 
   returned to normal pricing. Expect metrics to return to 
   baseline levels."
   ```

2. **Regenerate insights** with the context button:
   ```
   Additional Context: "Focus on true performance issues, not 
   expected post-sale normalization. Compare to weeks before 
   Black Friday for accurate trends."
   ```

3. **Review new insights** - they'll account for the Black Friday context!

---

## 📞 Support

If you have questions or suggestions for improving the context feature, let me know!





