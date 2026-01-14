# AI Search Rankings API Setup

To get real data from AI search engines, you need to set up API keys for the following services:

## Required API Keys

### 1. Perplexity API (Optional - for Perplexity AI results)
- Get your API key from: https://www.perplexity.ai/settings/api
- Set environment variable: `PERPLEXITY_API_KEY`

### 2. Google Custom Search API (Optional - for Google AI Overview results)
- Get your API key from: https://console.cloud.google.com/apis/credentials
- Create a Custom Search Engine at: https://programmablesearchengine.google.com/
- Set environment variables:
  - `GOOGLE_API_KEY` - Your Google API key
  - `GOOGLE_SEARCH_ENGINE_ID` - Your Custom Search Engine ID

### 3. Bing Search API (Optional - for Bing Chat results)
- Get your API key from: https://portal.azure.com/#create/Microsoft.CognitiveServicesBingSearch-v7
- Set environment variable: `BING_API_KEY`

## Setting Up on Render

1. Go to your Render Dashboard → Your Service
2. Click "Environment"
3. Add the API keys you want to use:
   - `PERPLEXITY_API_KEY` (if using Perplexity)
   - `GOOGLE_API_KEY` (if using Google)
   - `GOOGLE_SEARCH_ENGINE_ID` (if using Google)
   - `BING_API_KEY` (if using Bing)
4. Save and restart your service

## How It Works

- The API will attempt to query each service you have configured
- If an API key is missing, that service will be skipped (no error)
- Results are returned for all services that successfully return data
- If no APIs are configured, an empty array will be returned

## Note

The API currently queries "best shilajit" as the search term. This is hardcoded in the endpoint.
