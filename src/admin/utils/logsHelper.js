// src/utils/dbLogger.js

const Log = require('../../admin/models/logs/logsManagementModal');

/**
 * Logs admin actions
 * @param {Object} req - Express request object with session
 * @param {String} operation - 'add' | 'edit' | 'delete' | 'export'
 * @param {Object} jsonData - Any relevant data (e.g. request body, affected record)
 */
const generateLogs = async (req, operation, jsonData = {}) => {
    try {
        const admin = req.session?.admin;

        if (!admin) {
            console.warn('Admin session not found. Skipping log.');
            return;
        }

        await Log.create({
            adminType: admin.admin_type,
            backendUserId: admin.id,
            backendUserName: admin.name,
            backendUserEmail: admin.email,
            operation,
            isLoggedIn: admin.isLoggedIn,
            jsonData
        });
    } catch (error) {
        console.error('Failed to log admin action:', error.message);
    }
};

module.exports = { generateLogs };
