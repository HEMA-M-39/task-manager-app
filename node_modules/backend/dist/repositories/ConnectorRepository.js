"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorRepository = void 0;
const db_1 = __importDefault(require("../db"));
// Ensure connectors table exists
db_1.default.exec(`
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
exports.ConnectorRepository = {
    findAll: () => {
        const rows = db_1.default.prepare('SELECT * FROM connectors ORDER BY name ASC').all();
        return rows.map(row => ({
            ...row,
            enabled: Boolean(row.enabled)
        }));
    },
    findById: (id) => {
        const row = db_1.default.prepare('SELECT * FROM connectors WHERE id = ?').get(id);
        if (!row)
            return undefined;
        return {
            ...row,
            enabled: Boolean(row.enabled)
        };
    },
    upsert: (connector) => {
        const existing = exports.ConnectorRepository.findById(connector.id);
        const configStr = typeof connector.config === 'string' ? connector.config : JSON.stringify(connector.config || {});
        const enabledInt = connector.enabled ? 1 : 0;
        if (existing) {
            db_1.default.prepare(`
        UPDATE connectors 
        SET name = ?, type = ?, enabled = ?, config = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(connector.name, connector.type, enabledInt, configStr, connector.id);
        }
        else {
            db_1.default.prepare(`
        INSERT INTO connectors (id, name, type, enabled, config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(connector.id, connector.name, connector.type, enabledInt, configStr);
        }
        return exports.ConnectorRepository.findById(connector.id);
    },
    updateStatus: (id, enabled, config) => {
        const existing = exports.ConnectorRepository.findById(id);
        if (!existing)
            return undefined;
        const enabledInt = enabled ? 1 : 0;
        if (config !== undefined) {
            const configStr = typeof config === 'string' ? config : JSON.stringify(config);
            db_1.default.prepare(`
        UPDATE connectors 
        SET enabled = ?, config = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(enabledInt, configStr, id);
        }
        else {
            db_1.default.prepare(`
        UPDATE connectors 
        SET enabled = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(enabledInt, id);
        }
        return exports.ConnectorRepository.findById(id);
    },
    updateLastSynced: (id) => {
        db_1.default.prepare(`
      UPDATE connectors 
      SET last_synced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(id);
        return exports.ConnectorRepository.findById(id);
    },
    delete: (id) => {
        db_1.default.prepare('DELETE FROM connectors WHERE id = ?').run(id);
    }
};
