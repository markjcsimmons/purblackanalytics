# Purblack Analytics

A Next.js application with two-level password authentication for puranalytics.com.

## Access Levels

1. **Full Access**: Use your current password (set via environment variable)
   - Access to all pages including Overview, Dashboard, Reports, and Settings

2. **Limited Access**: Use password `PB2026!`
   - Access only to the Overview page

## Getting Started (Local Development)

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```
Then edit `.env.local` and set your full access password.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to puranalytics.com

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy to Vercel:
```bash
npm i -g vercel
vercel login
vercel --prod
```

Then configure your domain in Vercel dashboard and set environment variables.

## Project Structure

- `app/page.tsx` - Login page
- `app/overview/page.tsx` - Overview page (accessible to all authenticated users)
- `app/dashboard/page.tsx` - Dashboard (full access only)
- `app/reports/page.tsx` - Reports (full access only)
- `app/settings/page.tsx` - Settings (full access only)
- `lib/auth.ts` - Authentication logic and password configuration

## Environment Variables

- `FULL_ACCESS_PASSWORD`: Your current password for full access
- `NEXT_PUBLIC_FULL_ACCESS_PASSWORD`: Same password (needed for client-side auth)

Set these in your hosting platform's environment variables for production.

## Security Note

This is a basic implementation for demonstration. For production use, consider:
- Using proper session management (cookies, JWT tokens)
- Password hashing and secure storage
- HTTPS for all connections
- Rate limiting for login attempts
- More robust authentication mechanisms
- Server-side authentication instead of client-side password checking

