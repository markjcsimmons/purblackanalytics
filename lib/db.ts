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
    // Ensure UTF-8 encoding for text data
    db.pragma('encoding = "UTF-8"');
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
      romans_recommendations TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

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

  // Add romans_recommendations column if it doesn't exist (migration for existing databases)
  try {
    database.exec(`ALTER TABLE weeks ADD COLUMN romans_recommendations TEXT`);
  } catch (e: any) {
    // Column already exists, ignore error
    if (!e.message?.includes('duplicate column')) {
      console.warn('Could not add romans_recommendations column:', e.message);
    }
  }
}

export interface WeekData {
  weekStartDate: string;
  weekEndDate: string;
  notes?: string;
  romansRecommendations?: string;
  overallMetrics: { [key: string]: number };
  marketingChannels: { [channel: string]: { [metric: string]: number } };
  funnelMetrics: { [stage: string]: { [metric: string]: number } };
}

export function saveWeekData(data: WeekData, weekId?: number) {
  const database = getDb();
  
  let finalWeekId: number;
  
  if (weekId) {
    // Update existing week
    const updateWeek = database.prepare(
      'UPDATE weeks SET week_end_date = ?, notes = ?, romans_recommendations = ? WHERE id = ?'
    );
    updateWeek.run(
      data.weekEndDate,
      data.notes || null,
      data.romansRecommendations || null,
      weekId
    );
    finalWeekId = weekId;
  } else {
    // Check if week with this start date already exists
    const existingWeek = database.prepare(
      'SELECT id FROM weeks WHERE week_start_date = ?'
    ).get(data.weekStartDate) as { id: number } | undefined;
    
    if (existingWeek) {
      // Update existing week
      const updateWeek = database.prepare(
        'UPDATE weeks SET week_end_date = ?, notes = ?, romans_recommendations = ? WHERE id = ?'
      );
      updateWeek.run(
        data.weekEndDate,
        data.notes || null,
        data.romansRecommendations || null,
        existingWeek.id
      );
      finalWeekId = existingWeek.id;
    } else {
      // Insert new week
      const insertWeek = database.prepare(
        'INSERT INTO weeks (week_start_date, week_end_date, notes, romans_recommendations) VALUES (?, ?, ?, ?)'
      );
      const info = insertWeek.run(
        data.weekStartDate, 
        data.weekEndDate, 
        data.notes || null,
        data.romansRecommendations || null
      );
      finalWeekId = info.lastInsertRowid as number;
    }
  }

  // Delete existing metrics for this week
  database.prepare('DELETE FROM overall_metrics WHERE week_id = ?').run(finalWeekId);
  database.prepare('DELETE FROM marketing_channels WHERE week_id = ?').run(finalWeekId);
  database.prepare('DELETE FROM funnel_metrics WHERE week_id = ?').run(finalWeekId);

  // Insert overall metrics
  const insertOverallMetric = database.prepare(
    'INSERT INTO overall_metrics (week_id, metric_name, metric_value) VALUES (?, ?, ?)'
  );
  
  for (const [name, value] of Object.entries(data.overallMetrics)) {
    insertOverallMetric.run(finalWeekId, name, value);
  }

  // Insert marketing channel metrics
  const insertChannelMetric = database.prepare(
    'INSERT INTO marketing_channels (week_id, channel_name, metric_name, metric_value) VALUES (?, ?, ?, ?)'
  );
  
  for (const [channel, metrics] of Object.entries(data.marketingChannels)) {
    for (const [metric, value] of Object.entries(metrics)) {
      insertChannelMetric.run(finalWeekId, channel, metric, value);
    }
  }

  // Insert funnel metrics
  const insertFunnelMetric = database.prepare(
    'INSERT INTO funnel_metrics (week_id, stage_name, metric_name, metric_value) VALUES (?, ?, ?, ?)'
  );
  
  for (const [stage, metrics] of Object.entries(data.funnelMetrics)) {
    for (const [metric, value] of Object.entries(metrics)) {
      insertFunnelMetric.run(finalWeekId, stage, metric, value);
    }
  }

  return finalWeekId;
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
    insights
  };
}

/**
 * Find the previous week (7 days before the given week's start date)
 */
export function findPreviousWeek(weekStartDate: string) {
  const database = getDb();
  const currentDate = new Date(weekStartDate);
  const previousWeekStart = new Date(currentDate);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  
  const previousWeekStartStr = previousWeekStart.toISOString().split('T')[0];
  
  const previousWeek = database.prepare(
    'SELECT * FROM weeks WHERE week_start_date = ?'
  ).get(previousWeekStartStr) as any;
  
  if (!previousWeek) {
    return null;
  }
  
  const weekData = getWeekData(previousWeek.id);
  return weekData.week ? weekData : null;
}

/**
 * Find the same week a year ago (approximately 52 weeks before)
 * Looks for a week within ±3 days of the same date last year
 */
export function findSameWeekYearAgo(weekStartDate: string) {
  const database = getDb();
  const currentDate = new Date(weekStartDate);
  const yearAgoDate = new Date(currentDate);
  yearAgoDate.setFullYear(yearAgoDate.getFullYear() - 1);
  
  // Look for weeks within ±3 days of the same date last year
  const targetDateStr = yearAgoDate.toISOString().split('T')[0];
  const threeDaysBefore = new Date(yearAgoDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  const threeDaysAfter = new Date(yearAgoDate);
  threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
  
  const threeDaysBeforeStr = threeDaysBefore.toISOString().split('T')[0];
  const threeDaysAfterStr = threeDaysAfter.toISOString().split('T')[0];
  
  // Try exact match first
  let yearAgoWeek = database.prepare(
    'SELECT * FROM weeks WHERE week_start_date = ?'
  ).get(targetDateStr) as any;
  
  // If no exact match, find closest week within ±3 days
  if (!yearAgoWeek) {
    yearAgoWeek = database.prepare(
      'SELECT * FROM weeks WHERE week_start_date >= ? AND week_start_date <= ? ORDER BY ABS(julianday(week_start_date) - julianday(?)) LIMIT 1'
    ).get(threeDaysBeforeStr, threeDaysAfterStr, targetDateStr) as any;
  }
  
  if (!yearAgoWeek) {
    return null;
  }
  
  const weekData = getWeekData(yearAgoWeek.id);
  return weekData.week ? weekData : null;
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

export function getRecommendationRules() {
  const database = getDb();
  return database.prepare('SELECT * FROM recommendation_rules ORDER BY created_at DESC').all();
}

export function addRecommendationRule(ruleText: string) {
  const database = getDb();
  const insert = database.prepare('INSERT INTO recommendation_rules (rule_text) VALUES (?)');
  const info = insert.run(ruleText);
  return info.lastInsertRowid;
}

export function deleteRecommendationRule(ruleId: number) {
  const database = getDb();
  database.prepare('DELETE FROM recommendation_rules WHERE id = ?').run(ruleId);
}

