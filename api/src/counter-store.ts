import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

interface CounterStoreOptions {
  readonly databasePath: string;
}

export type CounterUpdateListener = (value: number) => void;

interface CounterRow {
  value: number;
}

export class CounterStore {
  private readonly db: Database.Database;

  private readonly selectStatement: Database.Statement<[], CounterRow>;

  private readonly updateStatement: Database.Statement<[]>;

  private readonly listeners = new Set<CounterUpdateListener>();

  private readonly incrementTransaction: Database.Transaction<[], number>;

  constructor(options: CounterStoreOptions) {
    const dbPath = options.databasePath === ':memory:' ? ':memory:' : resolve(options.databasePath);

    if (dbPath !== ':memory:' && !dbPath.startsWith('file:')) {
      mkdirSync(dirname(dbPath), { recursive: true });
    }

    this.db = new Database(dbPath) as Database.Database;
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS counter (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        value INTEGER NOT NULL
      );
    `);

    this.db.prepare('INSERT INTO counter (id, value) VALUES (1, 0) ON CONFLICT(id) DO NOTHING').run();

    this.selectStatement = this.db.prepare<[], CounterRow>('SELECT value FROM counter WHERE id = 1');
    this.updateStatement = this.db.prepare('UPDATE counter SET value = value + 1 WHERE id = 1');

    this.incrementTransaction = this.db.transaction(() => {
      this.updateStatement.run();
      const row = this.selectStatement.get();
      if (!row) {
        throw new Error('Counter row not found');
      }

      return row.value;
    });
  }

  getValue(): number {
    const row = this.selectStatement.get();
    if (!row) {
      throw new Error('Counter row not found');
    }

    return row.value;
  }

  increment(): number {
    const value = this.incrementTransaction();
    this.listeners.forEach((listener) => listener(value));
    return value;
  }

  onUpdate(listener: CounterUpdateListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: CounterUpdateListener): void {
    this.listeners.delete(listener);
  }

  close(): void {
    this.db.close();
    this.listeners.clear();
  }
}
