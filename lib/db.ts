// Lazy import to prevent build-time execution
import type Database from 'better-sqlite3';

let DatabaseModule: typeof Database | null = null;
let db: Database.Database | null = null;

function getDatabaseModule() {
  if (!DatabaseModule) {
    DatabaseModule = require('better-sqlite3');
  }
  return DatabaseModule;
}

// On Render, the persistent disk is mounted at /opt/render/project/src/data
// process.cwd() will be /opt/render/project/src, so data/analytics.db will be on the disk
function getDbPath() {
  const path = require('path');
  return path.join(process.cwd(), 'data', 'analytics.db');
}

export function getDb() {
  if (!db) {
    const Database = getDatabaseModule();
    if (!Database) {
      throw new Error('Database module not available');
    }
    const path = require('path');
    const fs = require('fs');
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = getDbPath();
    // TypeScript doesn't understand that Database is not null after the check
    db = new (Database as typeof Database)(dbPath);
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create weeks table
  database.exec(`
    CREATE TABLE IF NOT EXISTS weeks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start_date TEXT NOT NULL UNIQUE,
      week_end_date TEXT NOT NULL,
      notes TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Add romans_recommendations column if it doesn't exist (migration for existing databases)
  try {
    // Check if column exists by trying to select it
    database.prepare('SELECT romans_recommendations FROM weeks LIMIT 1').get();
  } catch (error: any) {
    // Column doesn't exist, add it
    if (error.message && error.message.includes('no such column')) {
      try {
        database.exec(`ALTER TABLE weeks ADD COLUMN romans_recommendations TEXT`);
        console.log('Added romans_recommendations column to weeks table');
      } catch (alterError: any) {
        console.error('Failed to add romans_recommendations column:', alterError.message);
      }
    }
  }

  // Create overall_metrics table
  database.exec(`
    CREATE TABLE IF NOT EXISTS overall_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE,
      UNIQUE(week_id, metric_name)
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
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE,
      UNIQUE(week_id, channel_name, metric_name)
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
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE,
      UNIQUE(week_id, stage_name, metric_name)
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

  // Create recommendation_rules table
  database.exec(`
    CREATE TABLE IF NOT EXISTS recommendation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create top_products table
  database.exec(`
    CREATE TABLE IF NOT EXISTS top_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      units_sold INTEGER NOT NULL,
      revenue REAL NOT NULL,
      rank INTEGER NOT NULL,
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE,
      UNIQUE(week_id, rank)
    )
  `);
}

export interface TopProduct {
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface WeekData {
  weekStartDate: string;
  weekEndDate: string;
  notes?: string;
  romansRecommendations?: string;
  overallMetrics: { [key: string]: number };
  marketingChannels: { [channel: string]: { [metric: string]: number } };
  funnelMetrics: { [stage: string]: { [metric: string]: number } };
  topProducts?: TopProduct[];
}

export function saveWeekData(data: WeekData) {
  const database = getDb();
  
  // Check if week already exists
  const existingWeek = database.prepare('SELECT id, romans_recommendations, notes FROM weeks WHERE week_start_date = ?').get(data.weekStartDate) as any;
  
  let weekId: number;
  
  if (existingWeek) {
    // Update existing week - preserve existing values if new ones aren't provided
    weekId = existingWeek.id;
    const updateWeek = database.prepare(
      'UPDATE weeks SET week_end_date = ?, notes = COALESCE(?, notes), romans_recommendations = COALESCE(?, romans_recommendations) WHERE id = ?'
    );
    updateWeek.run(
      data.weekEndDate,
      data.notes || null,
      data.romansRecommendations || null,
      weekId
    );
  } else {
    // Insert new week
    const insertWeek = database.prepare(
      'INSERT INTO weeks (week_start_date, week_end_date, notes, romans_recommendations) VALUES (?, ?, ?, ?)'
    );
    const info = insertWeek.run(data.weekStartDate, data.weekEndDate, data.notes || null, data.romansRecommendations || null);
    weekId = Number(info.lastInsertRowid);
  }

  // Delete existing metrics for this week
  database.prepare('DELETE FROM overall_metrics WHERE week_id = ?').run(weekId);
  database.prepare('DELETE FROM marketing_channels WHERE week_id = ?').run(weekId);
  database.prepare('DELETE FROM funnel_metrics WHERE week_id = ?').run(weekId);
  database.prepare('DELETE FROM top_products WHERE week_id = ?').run(weekId);

  // Insert overall metrics
  const insertOverallMetric = database.prepare(
    'INSERT INTO overall_metrics (week_id, metric_name, metric_value) VALUES (?, ?, ?)'
  );
  
  for (const [name, value] of Object.entries(data.overallMetrics)) {
    insertOverallMetric.run(weekId, name, value);
  }

  // Insert marketing channel metrics
  const insertChannelMetric = database.prepare(
    'INSERT INTO marketing_channels (week_id, channel_name, metric_name, metric_value) VALUES (?, ?, ?, ?)'
  );
  
  for (const [channel, metrics] of Object.entries(data.marketingChannels)) {
    for (const [metric, value] of Object.entries(metrics)) {
      insertChannelMetric.run(weekId, channel, metric, value);
    }
  }

  // Insert funnel metrics
  const insertFunnelMetric = database.prepare(
    'INSERT INTO funnel_metrics (week_id, stage_name, metric_name, metric_value) VALUES (?, ?, ?, ?)'
  );
  
  for (const [stage, metrics] of Object.entries(data.funnelMetrics)) {
    for (const [metric, value] of Object.entries(metrics)) {
      insertFunnelMetric.run(weekId, stage, metric, value);
    }
  }

  // Insert top products
  if (data.topProducts && Array.isArray(data.topProducts)) {
    const insertTopProduct = database.prepare(
      'INSERT INTO top_products (week_id, product_name, units_sold, revenue, rank) VALUES (?, ?, ?, ?, ?)'
    );
    
    data.topProducts.forEach((product, index) => {
      if (product.productName && product.unitsSold > 0) {
        insertTopProduct.run(weekId, product.productName, product.unitsSold, product.revenue || 0, index + 1);
      }
    });
  }

  return weekId;
}

export function getWeeks() {
  const database = getDb();
  return database.prepare('SELECT * FROM weeks ORDER BY week_start_date DESC').all();
}

export function getWeekData(weekId: number) {
  const database = getDb();
  
  const week = database.prepare('SELECT * FROM weeks WHERE id = ?').get(weekId);
  const overallMetrics = database.prepare('SELECT * FROM overall_metrics WHERE week_id = ?').all(weekId);
  const marketingChannels = database.prepare('SELECT * FROM marketing_channels WHERE week_id = ?').all(weekId);
  const funnelMetrics = database.prepare('SELECT * FROM funnel_metrics WHERE week_id = ?').all(weekId);
  const insightsRaw = database.prepare('SELECT * FROM insights WHERE week_id = ?').all(weekId) as any[];
  const topProductsRaw = database.prepare('SELECT * FROM top_products WHERE week_id = ? ORDER BY rank ASC').all(weekId) as any[];
  
  // Map database field names to component expected format
  const insights = insightsRaw.map((insight: any) => ({
    id: insight.id,
    text: insight.insight_text,
    type: insight.insight_type,
    priority: insight.priority,
  }));

  // Map top products to component expected format
  const topProducts = topProductsRaw.map((product: any) => ({
    productName: product.product_name,
    unitsSold: product.units_sold,
    revenue: product.revenue,
    rank: product.rank,
  }));

  return {
    week,
    overallMetrics,
    marketingChannels,
    funnelMetrics,
    insights,
    topProducts
  };
}

export function saveInsights(weekId: number, insights: Array<{ text: string; type: string; priority: string }>) {
  const database = getDb();
  
  // Delete existing insights
  database.prepare('DELETE FROM insights WHERE week_id = ?').run(weekId);

  const insertInsight = database.prepare(
    'INSERT INTO insights (week_id, insight_text, insight_type, priority) VALUES (?, ?, ?, ?)'
  );

  for (const insight of insights) {
    insertInsight.run(weekId, insight.text, insight.type, insight.priority);
  }
}

export function getAllData() {
  const database = getDb();
  const weeks = getWeeks();
  
  return weeks.map((week: any) => ({
    ...week,
    ...getWeekData(week.id)
  }));
}

// Recommendation Rules CRUD operations
export function getRecommendationRules() {
  const database = getDb();
  return database.prepare('SELECT * FROM recommendation_rules ORDER BY created_at DESC').all();
}

export function addRecommendationRule(ruleText: string) {
  const database = getDb();
  const insertRule = database.prepare(
    'INSERT INTO recommendation_rules (rule_text) VALUES (?)'
  );
  const result = insertRule.run(ruleText);
  return result.lastInsertRowid;
}

export function deleteRecommendationRule(ruleId: number) {
  const database = getDb();
  database.prepare('DELETE FROM recommendation_rules WHERE id = ?').run(ruleId);
}

