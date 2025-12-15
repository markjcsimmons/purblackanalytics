# Purblack Analytics Dashboard

A modern, AI-powered analytics dashboard for Purblack.com's ecommerce and marketing data. Built with Next.js, featuring automated insights powered by OpenAI.

## Features

- 📊 **Interactive Dashboard** - Beautiful, modern UI with real-time data visualization
- 🤖 **AI-Powered Insights** - Automatic analysis and recommendations using OpenAI GPT-4
- 📈 **Marketing Channel Analysis** - Track performance across Meta Ads, Google Ads, Email/SMS, SEO, and more
- 🔄 **Flexible Data Import** - Upload via CSV or paste directly from Google Docs
- 📝 **Smart Parser** - Automatically extracts metrics from your weekly reports
- 💾 **Local Database** - SQLite for fast, reliable data storage
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts
- **Database**: SQLite (better-sqlite3)
- **AI**: OpenAI GPT-4
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Uploading Data

You have **two options** for uploading data:

#### Option 1: Google Docs (Easiest!)
1. Go to the "Upload Data" tab → "Google Docs"
2. Open your weekly report in Google Docs
3. Select all (Cmd/Ctrl+A) and copy (Cmd/Ctrl+C)
4. Paste into the text area
5. Select dates and click "Import Data"

**Perfect for:** Your existing weekly reports - just copy & paste!

#### Option 2: CSV Upload
1. Go to the "Upload Data" tab → "CSV Upload"
2. Select the week start and end dates
3. Upload a CSV file with your marketing data
4. Click "Upload Data"

**Perfect for:** Automated data exports from tools

See `GOOGLE-DOCS-IMPORT.md` for detailed guide on Google Docs import.

### CSV Format

Your CSV file should have four columns: `Category`, `Subcategory`, `Metric`, `Value`

**Example:**
```csv
Category,Subcategory,Metric,Value
Overall,Store,Total Revenue,45000
Overall,Store,Total Orders,120
Overall,Store,Conversion Rate,2.5
Marketing,Meta Ads,Spend,5000
Marketing,Meta Ads,Revenue,15000
Marketing,Google Ads,Spend,3000
Funnel,Homepage,Visitors,4800
```

**Categories:**
- **Overall**: Store-wide metrics (Revenue, Orders, Conversion Rate, Visitors)
- **Marketing**: Channel-specific metrics (Meta Ads, Google Ads, Email & SMS, etc.)
- **Funnel**: Website funnel stages (Homepage, Product Page, Cart, Checkout)

### Generating AI Insights

1. Select a week from the dropdown
2. View your data on the "Overview" tab
3. Click "Generate Insights" to get AI-powered analysis
4. Review actionable recommendations prioritized by impact

## Project Structure

```
purblack-analytics/
├── app/
│   ├── api/              # API routes
│   │   ├── upload/       # Data upload endpoint
│   │   ├── insights/     # AI insights generation
│   │   └── weeks/        # Week data endpoints
│   └── page.tsx          # Main dashboard page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── data-upload.tsx   # CSV upload component
│   ├── insights-display.tsx  # AI insights display
│   └── metrics-chart.tsx # Chart components
├── lib/
│   ├── db.ts             # Database utilities
│   ├── openai.ts         # OpenAI integration
│   └── utils.ts          # Helper functions
└── data/                 # SQLite database (auto-created)
```

## Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add your `OPENAI_API_KEY` environment variable
4. Deploy!

**Note**: For production, consider using PostgreSQL instead of SQLite for better scalability.

### Other Platforms

- **Railway**: Supports SQLite and easy deployment
- **DigitalOcean App Platform**: Full control with managed services
- **Render**: Simple deployment with automatic SSL

## Cost Estimate

- **Hosting**: $0-10/month (Vercel hobby tier is free)
- **OpenAI API**: ~$1-5 per week for insights generation
- **Total**: ~$5-20/month for weekly analytics

## Customization

### Adding New Metrics

Edit the CSV upload format in `components/data-upload.tsx` to parse additional metrics.

### Changing AI Model

In `lib/openai.ts`, change `gpt-4o` to another model like `gpt-3.5-turbo` for lower costs.

### Using Anthropic Claude

Replace OpenAI with Anthropic in `lib/openai.ts` for Claude-powered insights.

## Troubleshooting

### Database Issues
- Delete the `data/` folder to reset the database
- Check file permissions in the project directory

### API Errors
- Verify your OpenAI API key is correct in `.env.local`
- Check you have sufficient API credits
- Review server logs for detailed error messages

### CSV Upload Fails
- Ensure CSV has the correct column headers
- Check that all values are numeric in the Value column
- Remove any special characters from category/metric names

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

## License

Proprietary - © 2024 Purblack.com
