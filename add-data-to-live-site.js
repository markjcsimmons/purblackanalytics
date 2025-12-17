// Script to add December 4-10, 2025 week data to live site
// Run with: node add-data-to-live-site.js

const https = require('https');

const SITE_URL = 'https://puranalytics.com';
const PASSWORD = 'Mark32246!';

// Format the week data according to the API structure
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
      "* Clicks": 0,
      "* Conversions": 10,
      "* Purchases": 10
    },
    "Email & SMS": {
      "* Revenue": 7214.60,
      "* Spend": 0,
      "* Open Rate": 52.5,
      "* CTR": 0.801,
      "* Sessions": 0,
      "* Purchases": 86
    },
    "Affiliates": {
      "* Revenue": 485.51,
      "* Spend": 72.81,
      "* Clicks": 45,
      "* Conversions": 6,
      "* Sessions": 0
    },
    "SEO": {
      "* Revenue": 0,
      "* Spend": 0,
      "* Impressions": 6063,
      "* Clicks": 418,
      "* Sessions": 418
    },
    "Social": {
      "* Revenue": 0,
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
      "* Time on page": 377,
      "* Scroll depth": 50
    },
    "Cart": {
      "* Abandonment rate": 11.22,
      "* Shipping issues": 0
    }
  }
};

// Function to make HTTP request
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Main function
async function addData() {
  try {
    console.log('Step 1: Authenticating...');
    
    // First, authenticate to get the cookie
    const loginResponse = await makeRequest(`${SITE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {}
    }, { password: PASSWORD });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    // Extract cookie from response
    const cookies = loginResponse.headers['set-cookie'];
    if (!cookies) {
      throw new Error('No authentication cookie received');
    }

    const authCookie = cookies.find(c => c.startsWith('auth_token='));
    if (!authCookie) {
      throw new Error('Auth token not found in cookies');
    }

    const cookieValue = authCookie.split(';')[0];

    console.log('✓ Authentication successful');
    console.log('Step 2: Uploading week data...');

    // Now upload the data
    const uploadResponse = await makeRequest(`${SITE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Cookie': cookieValue
      }
    }, weekData);

    if (uploadResponse.status === 200 || uploadResponse.status === 201) {
      console.log('✓ Data uploaded successfully!');
      console.log('Response:', uploadResponse.data);
      console.log(`\nWeek ID: ${uploadResponse.data.weekId}`);
      console.log(`\nYou can now view this week at: ${SITE_URL}`);
    } else {
      throw new Error(`Upload failed: ${uploadResponse.status} - ${JSON.stringify(uploadResponse.data)}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nIf this fails, you can add the data manually:');
    console.log('1. Go to https://puranalytics.com');
    console.log('2. Log in with password: Mark32246!');
    console.log('3. Go to "Add Data" tab');
    console.log('4. Enter the data from DATA-ENTRY-GUIDE.md');
    process.exit(1);
  }
}

// Run it
addData();
