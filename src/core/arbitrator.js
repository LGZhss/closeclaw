/**
 * 仲裁模块
 * 负责处理投票争议、决策确认和特殊情况
 */

import { votingEngine } from './voter.js';
import { log } from '../utils/logger.js';

export class Arbitrator {
    constructor() {
        this.cases = new Map(); // 存储仲裁案例
    }

    /**
     * 处理争议
     * @param {string} voteId 投票ID
     * @param {string} reason 争议原因
     * @param {string} requester 申请人
     * @returns {string} 仲裁案例ID
     */
    handleDispute(voteId, reason, requester) {
        const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.cases.set(caseId, {
            id: caseId,
            voteId,
            reason,
            requester,
            status: 'pending', // pending, resolved, rejected
            createdAt: new Date(),
            updatedAt: new Date()
        });

        log(`[Arbitrator] 收到争议: ${caseId}, 投票ID: ${voteId}, 申请人: ${requester}`, 'INFO');
        return caseId;
    }

    /**
     * 解决争议
     * @param {string} caseId 仲裁案例ID
     * @param {string} decision 决策
     * @param {string} reason 决策原因
     * @returns {Object} 仲裁结果
     */
    resolveDispute(caseId, decision, reason) {
        const caseRecord = this.cases.get(caseId);
        if (!caseRecord) {
            throw new Error('仲裁案例不存在');
        }

        caseRecord.status = 'resolved';
        caseRecord.decision = decision;
        caseRecord.decisionReason = reason;
        caseRecord.resolvedAt = new Date();
        caseRecord.updatedAt = new Date();

        log(`[Arbitrator] 解决争议: ${caseId}, 决策: ${decision}`, 'INFO');

        return {
            caseId,
            voteId: caseRecord.voteId,
            decision,
            reason,
            resolvedAt: caseRecord.resolvedAt
        };
    }

    /**
     * 拒绝争议
     * @param {string} caseId 仲裁案例ID
     * @param {string} reason 拒绝原因
     * @returns {Object} 仲裁结果
     */
    rejectDispute(caseId, reason) {
        const caseRecord = this.cases.get(caseId);
        if (!caseRecord) {
            throw new Error('仲裁案例不存在');
        }

        caseRecord.status = 'rejected';
        caseRecord.rejectionReason = reason;
        caseRecord.rejectedAt = new Date();
        caseRecord.updatedAt = new Date();

        log(`[Arbitrator] 拒绝争议: ${caseId}, 原因: ${reason}`, 'INFO');

        return {
            caseId,
            voteId: caseRecord.voteId,
            status: 'rejected',
            reason,
            rejectedAt: caseRecord.rejectedAt
        };
    }

    /**
     * 确认决策
     * @param {string} voteId 投票ID
     * @returns {Object} 确认结果
     */
    confirmDecision(voteId) {
        const voteStatus = votingEngine.getVoteStatus(voteId);
        if (voteStatus.status !== 'completed') {
            throw new Error('投票尚未完成');
        }

        const result = votingEngine.calculateResult(voteId);

        log(`[Arbitrator] 确认决策: ${voteId}, 结果: ${result.passed ? '通过' : '未通过'}`, 'INFO');

        return {
            voteId,
            result,
            confirmedAt: new Date(),
            status: 'confirmed'
        };
    }

    /**
     * 处理特殊情况
     * @param {string} type 特殊情况类型
     * @param {Object} data 相关数据
     * @returns {Object} 处理结果
     */
    handleSpecialCase(type, data) {
        switch (type) {
            case 'user_request':
                // 用户提出的修改要求
                return this.handleUserRequest(data);
            case 'voting_deadlock':
                // 投票僵局
                return this.handleVotingDeadlock(data);
            case 'emergency':
                // 紧急情况
                return this.handleEmergency(data);
            default:
                throw new Error('未知的特殊情况类型');
        }
    }

    /**
     * 处理用户请求
     * @param {Object} data 请求数据
     * @returns {Object} 处理结果
     */
    handleUserRequest(data) {
        const { request, chatId, userId } = data;

        log(`[Arbitrator] 处理用户请求: ${request}, 用户ID: ${userId}`, 'INFO');

        // 特批通过，后续可撤销
        return {
            type: 'user_request',
            status: 'approved',
            message: '用户请求已特批通过，后续可撤销',
            request,
            chatId,
            userId,
            handledAt: new Date()
        };
    }

    /**
     * 处理投票僵局
     * @param {Object} data 僵局数据
     * @returns {Object} 处理结果
     */
    handleVotingDeadlock(data) {
        const { voteId, reason } = data;

        log(`[Arbitrator] 处理投票僵局: ${voteId}, 原因: ${reason}`, 'INFO');

        // 用户可介入
        return {
            type: 'voting_deadlock',
            status: 'user_intervention_needed',
            message: '投票陷入僵局，需要用户介入',
            voteId,
            reason,
            handledAt: new Date()
        };
    }

    /**
     * 处理紧急情况
     * @param {Object} data 紧急情况数据
     * @returns {Object} 处理结果
     */
    handleEmergency(data) {
        const { emergency, chatId } = data;

        log(`[Arbitrator] 处理紧急情况: ${emergency}, 对话ID: ${chatId}`, 'INFO');

        // 紧急处理
        return {
            type: 'emergency',
            status: 'handled',
            message: '紧急情况已处理',
            emergency,
            chatId,
            handledAt: new Date()
        };
    }

    /**
     * 获取仲裁案例状态
     * @param {string} caseId 仲裁案例ID
     * @returns {Object} 案例状态
     */
    getCaseStatus(caseId) {
        const caseRecord = this.cases.get(caseId);
        if (!caseRecord) {
            throw new Error('仲裁案例不存在');
        }

        return caseRecord;
    }

    /**
     * 清理过期案例
     * @param {number} days 天数
     */
    cleanupExpiredCases(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        let removed = 0;
        for (const [caseId, caseRecord] of this.cases.entries()) {
            if (caseRecord.createdAt < cutoffDate) {
                this.cases.delete(caseId);
                removed++;
            }
        }

        if (removed > 0) {
            log(`[Arbitrator] 清理了 ${removed} 个过期仲裁案例`, 'INFO');
        }
    }
}

export const arbitrator = new Arbitrator();
