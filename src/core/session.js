import { initOSMemory } from '../utils/os_memory.js';
import { log } from '../utils/logger.js';

export class SessionManager {
    constructor() {
        this.histories = new Map();
        this.db = null;
    }

    async init() {
        try {
            this.db = await initOSMemory();
            await this.db.exec(`
              CREATE TABLE IF NOT EXISTS os_context_l1 (
                chatId TEXT PRIMARY KEY,
                history_json TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `);
            // Load existing histories from DB
            const rows = await this.db.all('SELECT chatId, history_json FROM os_context_l1');
            for (const row of rows) {
                try {
                    this.histories.set(row.chatId, JSON.parse(row.history_json));
                } catch (e) {
                    log(`[SessionManager] Failed to parse history for ${row.chatId}`, 'WARN');
                }
            }
            log(`[SessionManager] Loaded ${rows.length} active sessions from L1 SQLite DB`, 'SUCCESS');
        } catch (e) {
            log(`[SessionManager] Initialization failed: ${e.message}`, 'ERROR');
        }
    }

    async _saveToDb(chatId) {
        if (!this.db) return;
        const history = this.histories.get(chatId) || [];
        try {
            await this.db.run(
                'INSERT OR REPLACE INTO os_context_l1 (chatId, history_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [chatId.toString(), JSON.stringify(history)]
            );
        } catch (e) {
            log(`[SessionManager] Failed to persist history to DB: ${e.message}`, 'ERROR');
        }
    }

    /**
     * 获取特定对话的历史记录
     * @param {number|string} chatId 
     * @returns {Array} 对话记录数组
     */
    getHistory(chatId) {
        if (!this.histories.has(chatId)) {
            this.histories.set(chatId, []);
        }
        return this.histories.get(chatId);
    }

    /**
     * 追加历史项目 (支持原生 JSON parts)
     */
    appendHistoryItem(chatId, role, parts) {
        const history = this.getHistory(chatId);
        history.push({ role, parts });
        this._saveToDb(chatId);
    }

    /**
     * 追加用户发言 (兼容纯文本)
     */
    appendUserMessage(chatId, text) {
        this.appendHistoryItem(chatId, 'user', [{ text }]);
    }

    /**
     * 追加模型发言 (兼容纯文本)
     */
    appendModelMessage(chatId, text) {
        this.appendHistoryItem(chatId, 'model', [{ text }]);
    }

    /**
     * 追加 Function Call (大模型主动调用)
     */
    appendFunctionCall(chatId, functionCall) {
        this.appendHistoryItem(chatId, 'model', [{ functionCall }]);
    }

    /**
     * 追加 Function Response (系统执行完毕返回给大模型)
     */
    appendFunctionResponse(chatId, name, content) {
        this.appendHistoryItem(chatId, 'user', [{
            functionResponse: {
                name,
                response: { name, content }
            }
        }]);
    }

    truncateHistory(chatId, maxHistoryPairs) {
        const history = this.getHistory(chatId);
        let changed = false;
        while (history.length > maxHistoryPairs * 2) {
            history.splice(0, 2);
            changed = true;
        }
        if (changed) this._saveToDb(chatId);
    }

    /**
     * 获取底层 Map（为了向下兼容 memoryManager 的遍历等操作）
     */
    getHistoriesMap() {
        return this.histories;
    }

    /**
     * 清除历史记录
     */
    clearHistory(chatId) {
        this.histories.set(chatId, []);
        this._saveToDb(chatId);
    }
}

export const sessionManager = new SessionManager();
