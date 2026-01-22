import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) {
    return db;
  }

  // Use a persistent path for the database
  const dbDir = process.env.DATABASE_DIR || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'analytics.db');

  db = new Database(dbPath);
  initializeDatabase(db);
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create weeks table
  database.exec(`
    CREATE TABLE IF NOT EXISTS weeks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start_date TEXT NOT NULL,
      week_end_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create overall_metrics table
  database.exec(`
    CREATE TABLE IF NOT EXISTS overall_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE
    )
  `);

  // Create marketing_channels table
  database.exec(`
    CREATE TABLE IF NOT EXISTS marketing_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      channel_name TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE
    )
  `);

  // Create funnel_metrics table
  database.exec(`
    CREATE TABLE IF NOT EXISTS funnel_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      stage_name TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE
    )
  `);

  // Create insights table
  database.exec(`
    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      insight_text TEXT NOT NULL,
      insight_type TEXT NOT NULL,
      priority TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE
    )
  `);

  // Create promotions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      offer_type TEXT NOT NULL,
      net_sales REAL,
      gross_sales REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE SET NULL
    )
  `);
}

export interface PromotionData {
  startDate: string;
  endDate: string;
  offerType: string;
  netSales?: number | null;
  grossSales?: number | null;
  weekId?: number;
}

export function savePromotion(data: PromotionData) {
  const database = getDb();
  
  // Try to find matching week based on date range
  let weekId: number | null = null;
  if (data.weekId) {
    weekId = data.weekId;
  } else {
    // Find week that overlaps with promotion dates
    const week = database.prepare(`
      SELECT id FROM weeks 
      WHERE (week_start_date <= ? AND week_end_date >= ?)
         OR (week_start_date <= ? AND week_end_date >= ?)
         OR (week_start_date >= ? AND week_end_date <= ?)
      LIMIT 1
    `).get(data.startDate, data.startDate, data.endDate, data.endDate, data.startDate, data.endDate) as any;
    
    if (week) {
      weekId = week.id;
    }
  }
  
  const insertPromotion = database.prepare(`
    INSERT INTO promotions (week_id, start_date, end_date, offer_type, net_sales, gross_sales)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertPromotion.run(
    weekId,
    data.startDate,
    data.endDate,
    data.offerType,
    data.netSales || null,
    data.grossSales || null
  );
  
  return database.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
}

export function getAllPromotions() {
  const database = getDb();
  return database.prepare('SELECT * FROM promotions ORDER BY start_date DESC').all();
}

export function getPromotionsForWeek(weekId: number) {
  const database = getDb();
  return database.prepare('SELECT * FROM promotions WHERE week_id = ?').all(weekId);
}

export function getAllData() {
  const database = getDb();
  const weeks = database.prepare('SELECT * FROM weeks ORDER BY week_start_date DESC').all();
  
  return weeks.map((week: any) => {
    const overallMetrics = database.prepare('SELECT * FROM overall_metrics WHERE week_id = ?').all(week.id);
    const marketingChannels = database.prepare('SELECT * FROM marketing_channels WHERE week_id = ?').all(week.id);
    const funnelMetrics = database.prepare('SELECT * FROM funnel_metrics WHERE week_id = ?').all(week.id);
    const promotions = database.prepare('SELECT * FROM promotions WHERE week_id = ?').all(week.id);
    
    return {
      week,
      overallMetrics,
      marketingChannels,
      funnelMetrics,
      promotions,
    };
  });
}

export function getWeekData(weekId: number) {
  const database = getDb();

  const week = database.prepare('SELECT * FROM weeks WHERE id = ?').get(weekId);
  const overallMetrics = database.prepare('SELECT * FROM overall_metrics WHERE week_id = ?').all(weekId);
  const marketingChannels = database.prepare('SELECT * FROM marketing_channels WHERE week_id = ?').all(weekId);
  const funnelMetrics = database.prepare('SELECT * FROM funnel_metrics WHERE week_id = ?').all(weekId);
  const insightsRaw = database.prepare('SELECT * FROM insights WHERE week_id = ?').all(weekId) as any[];
  const promotions = database.prepare('SELECT * FROM promotions WHERE week_id = ?').all(weekId);

  // Map database field names to component expected format
  const insights = insightsRaw.map((insight: any) => ({
    id: insight.id,
    text: insight.insight_text,
    type: insight.insight_type,
    priority: insight.priority,
  }));

  return {
    week,
    overallMetrics,
    marketingChannels,
    funnelMetrics,
    insights,
    promotions,
  };
}

export function getWeeks() {
  const database = getDb();
  return database.prepare('SELECT * FROM weeks ORDER BY week_start_date DESC').all();
}
