#!/bin/bash
# Script to add OpenAI API key to Render
# Note: This requires Render CLI or manual dashboard entry

echo "To add the OpenAI API key to Render:"
echo ""
echo "1. Go to: https://dashboard.render.com"
echo "2. Click on your service: puranalytics"
echo "3. Click 'Environment' in the left sidebar"
echo "4. Scroll to 'Environment Variables'"
echo "5. Click 'Add Environment Variable'"
echo "6. Key: OPENAI_API_KEY"
echo "7. Value: (your API key from .env.local)"
echo "8. Click 'Save Changes'"
echo ""
echo "The API key from your .env.local file is:"
echo "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"
echo ""
echo "After adding, Render will automatically redeploy."
