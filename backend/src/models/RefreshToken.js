const Database = require('../database/db');

class RefreshToken {
    constructor() {
        this.db = Database.getInstance();
    }

    async create({ userId, tokenHash, expiresAt, userAgent = null, ipAddress = null }) {
        const query = `
            INSERT INTO user_refresh_tokens (
                user_id,
                token_hash,
                expires_at,
                user_agent,
                ip_address
            ) VALUES (?, ?, ?, ?, ?)
        `;

        const result = await this.db.run(query, [
            userId,
            tokenHash,
            expiresAt,
            userAgent,
            ipAddress
        ]);

        return result.lastID;
    }

    async findByHash(tokenHash) {
        const query = `
            SELECT *
            FROM user_refresh_tokens
            WHERE token_hash = ?
            LIMIT 1
        `;
        return this.db.get(query, [tokenHash]);
    }

    async markAsRevoked(id, reason = 'revoked', replacementHash = null) {
        const query = `
            UPDATE user_refresh_tokens
            SET revoked_at = datetime('now'),
                revoked_reason = ?,
                replaced_by_token_hash = COALESCE(?, replaced_by_token_hash)
            WHERE id = ?
        `;

        await this.db.run(query, [reason, replacementHash, id]);
    }

    async revokeFamily(userId) {
        const query = `
            UPDATE user_refresh_tokens
            SET revoked_at = datetime('now'),
                revoked_reason = 'compromised'
            WHERE user_id = ?
              AND revoked_at IS NULL
        `;

        await this.db.run(query, [userId]);
    }

    async deleteExpired() {
        const query = `
            DELETE FROM user_refresh_tokens
            WHERE expires_at <= datetime('now')
        `;
        await this.db.run(query);
    }
}

module.exports = RefreshToken;

