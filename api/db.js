var Database = require('better-sqlite3');
var crypto = require('crypto');
var path = require('path');

var DB_PATH = path.join(process.env.DB_PATH || '/app/data', 'amadeus.db');
var db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec([
  'CREATE TABLE IF NOT EXISTS users (',
  '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
  '  email TEXT UNIQUE NOT NULL,',
  '  paid_at DATETIME,',
  '  stripe_customer_id TEXT,',
  '  stripe_session_id TEXT,',
  '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
  ')',
].join('\n'));

db.exec([
  'CREATE TABLE IF NOT EXISTS magic_links (',
  '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
  '  user_id INTEGER NOT NULL REFERENCES users(id),',
  '  token TEXT UNIQUE NOT NULL,',
  '  expires_at DATETIME NOT NULL,',
  '  used_at DATETIME,',
  '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
  ')',
].join('\n'));

db.exec([
  'CREATE TABLE IF NOT EXISTS progress (',
  '  user_id INTEGER PRIMARY KEY REFERENCES users(id),',
  '  exercise_index INTEGER DEFAULT -1,',
  '  step_index INTEGER DEFAULT 0,',
  '  exercises_completed TEXT DEFAULT \'[]\',',
  '  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP',
  ')',
].join('\n'));

// Prepared statements
var stmts = {
  findUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  findUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  findUserByStripeSession: db.prepare('SELECT * FROM users WHERE stripe_session_id = ?'),
  createUser: db.prepare('INSERT INTO users (email) VALUES (?) RETURNING *'),
  markPaid: db.prepare('UPDATE users SET paid_at = CURRENT_TIMESTAMP, stripe_customer_id = ?, stripe_session_id = ? WHERE id = ?'),
  setStripeSession: db.prepare('UPDATE users SET stripe_session_id = ? WHERE id = ?'),

  createMagicLink: db.prepare('INSERT INTO magic_links (user_id, token, expires_at) VALUES (?, ?, ?)'),
  findMagicLink: db.prepare('SELECT * FROM magic_links WHERE token = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP'),
  useMagicLink: db.prepare('UPDATE magic_links SET used_at = CURRENT_TIMESTAMP WHERE id = ?'),
  countRecentMagicLinks: db.prepare('SELECT COUNT(*) as count FROM magic_links WHERE user_id = ? AND created_at > datetime(CURRENT_TIMESTAMP, \'-1 hour\')'),

  getProgress: db.prepare('SELECT * FROM progress WHERE user_id = ?'),
  upsertProgress: db.prepare([
    'INSERT INTO progress (user_id, exercise_index, step_index, exercises_completed, updated_at)',
    'VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
    'ON CONFLICT(user_id) DO UPDATE SET',
    '  exercise_index = excluded.exercise_index,',
    '  step_index = excluded.step_index,',
    '  exercises_completed = excluded.exercises_completed,',
    '  updated_at = CURRENT_TIMESTAMP',
  ].join(' ')),
};

function findOrCreateUser(email) {
  var user = stmts.findUserByEmail.get(email.toLowerCase());
  if (user) return user;
  return stmts.createUser.get(email.toLowerCase());
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  db: db,
  stmts: stmts,
  findOrCreateUser: findOrCreateUser,
  generateToken: generateToken,
};
