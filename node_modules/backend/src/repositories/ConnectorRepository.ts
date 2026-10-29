import db from '../db';

export interface Connector {
  id: string; // e.g. 'github'
  name: string; // e.g. 'GitHub'
  type: string; // e.g. 'vcs'
  enabled: boolean;
  config: string; // JSON string or object serialized as string
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

// Ensure connectors table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS connectors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    config TEXT DEFAULT '{}',
    last_synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const ConnectorRepository = {
  findAll: (): Connector[] => {
    const rows = db.prepare('SELECT * FROM connectors ORDER BY name ASC').all() as any[];
    return rows.map(row => ({
      ...row,
      enabled: Boolean(row.enabled)
    }));
  },

  findById: (id: string): Connector | undefined => {
    const row = db.prepare('SELECT * FROM connectors WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      enabled: Boolean(row.enabled)
    };
  },

  upsert: (connector: { id: string; name: string; type: string; enabled: boolean; config?: Record<string, any> }): Connector => {
    const existing = ConnectorRepository.findById(connector.id);
    const configStr = typeof connector.config === 'string' ? connector.config : JSON.stringify(connector.config || {});
    const enabledInt = connector.enabled ? 1 : 0;

    if (existing) {
      db.prepare(`
        UPDATE connectors 
        SET name = ?, type = ?, enabled = ?, config = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(connector.name, connector.type, enabledInt, configStr, connector.id);
    } else {
      db.prepare(`
        INSERT INTO connectors (id, name, type, enabled, config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(connector.id, connector.name, connector.type, enabledInt, configStr);
    }

    return ConnectorRepository.findById(connector.id)!;
  },

  updateStatus: (id: string, enabled: boolean, config?: Record<string, any>): Connector | undefined => {
    const existing = ConnectorRepository.findById(id);
    if (!existing) return undefined;

    const enabledInt = enabled ? 1 : 0;
    if (config !== undefined) {
      const configStr = typeof config === 'string' ? config : JSON.stringify(config);
      db.prepare(`
        UPDATE connectors 
        SET enabled = ?, config = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(enabledInt, configStr, id);
    } else {
      db.prepare(`
        UPDATE connectors 
        SET enabled = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(enabledInt, id);
    }

    return ConnectorRepository.findById(id);
  },

  updateLastSynced: (id: string): Connector | undefined => {
    db.prepare(`
      UPDATE connectors 
      SET last_synced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(id);
    return ConnectorRepository.findById(id);
  },

  delete: (id: string) => {
    db.prepare('DELETE FROM connectors WHERE id = ?').run(id);
  }
};
