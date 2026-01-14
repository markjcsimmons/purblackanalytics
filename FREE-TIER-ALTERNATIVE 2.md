# Alternative: Using Free Tier with Managed Database

If you want to stay on Render's free tier, you'll need to migrate from SQLite to a managed database.

## Why?

Render's free tier does **NOT** support persistent disks. Your SQLite database will be wiped on each deployment.

## Solution: Migrate to Supabase (PostgreSQL)

Supabase offers a free PostgreSQL database that works perfectly with Render's free tier.

### Steps:

1. **Create Supabase account**: [supabase.com](https://supabase.com) (free tier available)

2. **Create a new project** in Supabase

3. **Get connection string** from Supabase dashboard (Settings → Database → Connection string)

4. **Install PostgreSQL driver**:
   ```bash
   npm install pg
   npm install --save-dev @types/pg
   ```

5. **Update `lib/db.ts`** to use PostgreSQL instead of SQLite

6. **Update database schema** - PostgreSQL uses slightly different SQL syntax

7. **Set environment variable** on Render:
   - `DATABASE_URL` = your Supabase connection string

This allows you to use Render's free tier while having a persistent database.

## Other Options:

- **PlanetScale** (MySQL) - Free tier available
- **Neon** (PostgreSQL) - Free tier available
- **Railway** - Alternative hosting with SQLite support on free tier
- **Fly.io** - Alternative hosting with volumes on free tier

## Recommendation

If you want to stay on free tier: Migrate to Supabase
If you want to keep SQLite: Use Render Starter ($7/month)
