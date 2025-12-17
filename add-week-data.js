// Script to add week data for December 4-10, 2025
// Run this with: node add-week-data.js

const weekData = {
  weekStartDate: "2025-12-04",
  weekEndDate: "2025-12-10",
  notes: `Weekly Marketing Report - December 4-10, 2025

Key Trends:
- Revenue: $6,357.18 (down 77.8% from previous week)
- Conversion Rate: 2.49% (down 58% from previous week)
- AOV: $84.32 (down 38.5% from previous week)
- Sessions: 1,484 (down 35.8% from previous week)

Marketing Channel Performance:
- Google Ads: $858.06 revenue, $666.69 spend, 128.71% ROAS
- Email & SMS: $7,214.60 revenue, 52.5% open rate, 0.801% CTR
- Affiliates: $485.51 revenue, $72.81 spend, 6 conversions from 45 clicks
- SEO: 6,063 impressions, 418 clicks, rankings dropped 30%

Funnel Analysis:
- Sessions → ATC: 6.47% (1,484 → 96)
- ATC → Checkout: 83.33% (96 → 80)
- Checkout → Purchase: 46.25% (80 → 37)

Key Recommendations:
- Website performance is the primary driver affecting all channels
- Need marketing strategy to distribute purchases evenly
- Focus on increasing items per order (currently 1.6 vs 2.7 last year)
- Discount strategy is working well, but full-price orders declining`,
  
  overallMetrics: {
    "Revenue": 6357.18,
    "Orders": 78,
    "AOV": 84.32,
    "Conversion Rate": 2.49,
    "Total Sessions": 1484,
    "New Customers": 26,
    "Returning Customers": 47
  },
  
  marketingChannels: {
    "Google Ads": {
      "* Revenue": 858.06,
      "* Spend": 666.69,
      "* Sessions": 107,
      "* Clicks": 0, // Not explicitly stated in report
      "* Conversions": 10, // Estimated from revenue/AOV
      "* Purchases": 10
    },
    "Email & SMS": {
      "* Revenue": 7214.60,
      "* Spend": 0, // Not mentioned in report
      "* Open Rate": 52.5,
      "* CTR": 0.801,
      "* Sessions": 0, // Not explicitly stated
      "* Purchases": 86 // Estimated from revenue/AOV (7214.60/84.32)
    },
    "Affiliates": {
      "* Revenue": 485.51,
      "* Spend": 72.81,
      "* Clicks": 45,
      "* Conversions": 6,
      "* Sessions": 0 // Not explicitly stated
    },
    "SEO": {
      "* Revenue": 0, // Not explicitly stated, would need to calculate
      "* Spend": 0,
      "* Impressions": 6063,
      "* Clicks": 418,
      "* Sessions": 418 // Using clicks as proxy for sessions
    },
    "Social": {
      "* Revenue": 0, // Not mentioned in report
      "* Spend": 0,
      "* Sessions": 0
    }
  },
  
  funnelMetrics: {
    "Sessions → Add to Cart": {
      "Sessions": 1484,
      "Add to Cart": 96,
      "Rate": 6.47
    },
    "Add to Cart → Checkout": {
      "Add to Cart": 96,
      "Checkout": 80,
      "Rate": 83.33
    },
    "Checkout → Purchase": {
      "Checkout": 80,
      "Purchases": 37,
      "Rate": 46.25
    },
    "Product Page": {
      "* Add-to-cart rate": 20.66,
      "* Time on page": 377, // 6m 17s in seconds
      "* Scroll depth": 50 // 50% Product card, 25% Reviews (using 50% as main metric)
    },
    "Cart": {
      "* Abandonment rate": 11.22, // Cart abandonment
      "* Shipping issues": 0 // Usually absent
    }
  }
};

// Convert to the format expected by the API
const apiData = {
  weekStartDate: weekData.weekStartDate,
  weekEndDate: weekData.weekEndDate,
  notes: weekData.notes,
  overallMetrics: weekData.overallMetrics,
  marketingChannels: weekData.marketingChannels,
  funnelMetrics: weekData.funnelMetrics
};

console.log("Week Data to Submit:");
console.log(JSON.stringify(apiData, null, 2));

// Instructions for manual submission
console.log("\n\nTo add this data to your live site:");
console.log("1. Go to https://puranalytics.com");
console.log("2. Log in with password: Mark32246!");
console.log("3. Go to 'Add Data' tab");
console.log("4. Enter the data manually using the form");
console.log("\nOR use the API directly (requires authentication):");
console.log("POST to https://puranalytics.com/api/upload");
console.log("Body:", JSON.stringify(apiData));
