# AI Search Brand Tracking

This feature allows you to track which shilajit brands are ranking well across multiple AI-powered search engines.

## Features

- **Multi-Engine Search**: Query multiple AI search engines simultaneously:
  - Perplexity AI
  - Google AI Overview
  - Bing Chat
  - ChatGPT (requires API key)

- **Brand Detection**: Automatically extracts mentions of known shilajit brands from search results

- **Ranking Analysis**: Calculates brand rankings based on:
  - Total mentions across all search engines
  - Average position in results
  - Which search engines mention each brand
  - Last seen timestamp

- **Data Persistence**: Stores search results in `data/brand-tracking-results.json` for historical tracking

## Usage

1. Navigate to the **Brand Tracking** page (requires full access)

2. Enter your search query (e.g., "best shilajit brands", "top shilajit products")

3. Select which search engines to query:
   - **Perplexity**: Works without API key (web scraping), or use API key for better results
   - **Google**: Web scraping (may be limited)
   - **Bing**: Web scraping (may be limited)
   - **ChatGPT**: Requires OpenAI API key

4. (Optional) Add API keys for better results:
   - **Perplexity API Key**: Get from [Perplexity API](https://www.perplexity.ai/settings/api)
   - **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

5. Click **"Search AI Engines"** to run the queries

6. View the results:
   - **Brand Rankings Table**: Shows which brands are mentioned most frequently
   - **Recent Search Results**: Displays individual search engine responses

## Tracked Brands

The system automatically detects mentions of these brands:
- Purblack / Pürblack
- Himalayan Shilajit
- PrimaVie
- Lost Empire Herbs
- Shilajit Gold
- Organic India
- Pure Himalayan
- Himalayan Healing
- Shilajit Resin
- Ancient Purity
- Sunfood
- Banyan Botanicals
- Omica Organics
- Mountain Drop

You can modify the brand list in `lib/brandTracker.ts`.

## API Endpoints

### POST `/api/brand-tracking`
Run a new search across AI engines.

**Request Body:**
```json
{
  "query": "best shilajit brands",
  "perplexityApiKey": "optional",
  "openaiApiKey": "optional",
  "enabledEngines": ["perplexity", "google", "bing"]
}
```

**Response:**
```json
{
  "success": true,
  "results": [...],
  "rankings": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET `/api/brand-tracking?query=shilajit`
Retrieve existing search results, optionally filtered by query.

## Data Storage

Search results are stored in `data/brand-tracking-results.json`. The system keeps the last 1000 results to prevent the file from growing too large.

## Limitations

- **Web Scraping**: Some search engines may block or limit web scraping. Using official APIs provides better results.
- **Rate Limiting**: Be mindful of rate limits when querying multiple engines frequently.
- **Dynamic Content**: Some AI search results load dynamically, which may not be captured by web scraping.

## Future Enhancements

- Scheduled automatic searches
- Email alerts for ranking changes
- Historical trend charts
- Export to CSV/Excel
- Custom brand list management
- Integration with more AI search engines
