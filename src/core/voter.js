/**
 * 投票引擎
 * 负责管理投票流程、计算投票得分、验证法定人数、判断是否通过
 */

import { config } from '../config/config.js';
import { log } from '../utils/logger.js';

export class VotingEngine {
    constructor() {
        this.votes = new Map(); // 存储投票记录
    }

    /**
     * 发起投票
     * @param {string} proposalId 提案ID
     * @param {string} proposal 提案内容
     * @param {number} level 决议级别 (1-3)
     * @param {Array} participants 参与方列表
     * @returns {string} 投票ID
     */
    initiateVote(proposalId, proposal, level, participants) {
        const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.votes.set(voteId, {
            id: voteId,
            proposalId,
            proposal,
            level,
            participants,
            votes: {},
            userVote: null,
            status: 'active', // active, completed
            createdAt: new Date(),
            updatedAt: new Date()
        });

        log(`[VotingEngine] 发起投票: ${voteId}, 级别: ${level}, 参与方: ${participants.length}`, 'INFO');
        return voteId;
    }

    /**
     * 投���
     * @param {string} voteId 投票ID
     * @param {string} participant 参与方
     * @param {number} vote 投票 (-1: 反对, 0: 弃权, 1: 赞同)
     */
    castVote(voteId, participant, vote) {
        const voteRecord = this.votes.get(voteId);
        if (!voteRecord || voteRecord.status !== 'active') {
            throw new Error('投票不存在或已结束');
        }

        if (!voteRecord.participants.includes(participant)) {
            throw new Error('参与方不在投票列表中');
        }

        if (![-1, 0, 1].includes(vote)) {
            throw new Error('投票值必须是 -1 (反对), 0 (弃权), 或 1 (赞同)');
        }

        voteRecord.votes[participant] = vote;
        voteRecord.updatedAt = new Date();

        log(`[VotingEngine] ${participant} 投票: ${vote === 1 ? '赞同' : vote === -1 ? '反对' : '弃权'}`, 'INFO');
    }

    /**
     * 用户投票
     * @param {string} voteId 投票ID
     * @param {number} vote 投票 (-1: 反对, 0: 弃权, 1: 赞同)
     */
    castUserVote(voteId, vote) {
        const voteRecord = this.votes.get(voteId);
        if (!voteRecord || voteRecord.status !== 'active') {
            throw new Error('投票不存在或已结束');
        }

        if (![-1, 0, 1].includes(vote)) {
            throw new Error('投票值必须是 -1 (反对), 0 (弃权), 或 1 (赞同)');
        }

        voteRecord.userVote = vote;
        voteRecord.updatedAt = new Date();

        log(`[VotingEngine] 用户投票: ${vote === 1 ? '赞同' : vote === -1 ? '反对' : '弃权'}`, 'INFO');
    }

    /**
     * 计算投票结果
     * @param {string} voteId 投票ID
     * @returns {Object} 投票结果
     */
    calculateResult(voteId) {
        const voteRecord = this.votes.get(voteId);
        if (!voteRecord) {
            throw new Error('投票不存在');
        }

        // 计算协作主体投票得分
        const ideVotes = Object.values(voteRecord.votes);
        const ideScore = ideVotes.reduce((sum, vote) => sum + vote, 0);

        // 计算用户投票得分
        let userScore = 0;
        if (voteRecord.userVote !== null) {
            userScore = ideScore * 0.5 * voteRecord.userVote;
        }

        // 计算综合得分
        const totalScore = ideScore + userScore;

        // 计算反对票数
        const 反对票数 = ideVotes.filter(vote => vote === -1).length;

        // 检查法定人数
        const quorum = config.voting.quorum[`level${voteRecord.level}`];
        const actualParticipants = ideVotes.length;
        const quorumMet = actualParticipants >= quorum;

        // 判断是否通过
        const passed = totalScore > 反对票数 && quorumMet;

        // 更新投票状态
        voteRecord.status = 'completed';

        const result = {
            voteId,
            proposalId: voteRecord.proposalId,
            level: voteRecord.level,
            ideScore,
            userScore,
            totalScore,
            反对票数,
            actualParticipants,
            requiredQuorum: quorum,
            quorumMet,
            passed,
            votes: voteRecord.votes,
            userVote: voteRecord.userVote,
            completedAt: new Date()
        };

        log(`[VotingEngine] 投票结果: ${passed ? '通过' : '未通过'}, 综合得分: ${totalScore}, 反对票数: ${反对票数}, 法定人数: ${quorumMet ? '满足' : '不满足'}`, 'INFO');

        return result;
    }

    /**
     * 获取投票状态
     * @param {string} voteId 投票ID
     * @returns {Object} 投票状态
     */
    getVoteStatus(voteId) {
        const voteRecord = this.votes.get(voteId);
        if (!voteRecord) {
            throw new Error('投票不存在');
        }

        const ideVotes = Object.values(voteRecord.votes);
        const actualParticipants = ideVotes.length;
        const quorum = config.voting.quorum[`level${voteRecord.level}`];

        return {
            voteId: voteRecord.id,
            proposalId: voteRecord.proposalId,
            proposal: voteRecord.proposal,
            level: voteRecord.level,
            status: voteRecord.status,
            participants: voteRecord.participants,
            actualParticipants,
            requiredQuorum: quorum,
            quorumMet: actualParticipants >= quorum,
            votes: voteRecord.votes,
            userVote: voteRecord.userVote,
            createdAt: voteRecord.createdAt,
            updatedAt: voteRecord.updatedAt
        };
    }

    /**
     * 清理过期投票
     * @param {number} days 天数
     */
    cleanupExpiredVotes(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        let removed = 0;
        for (const [voteId, voteRecord] of this.votes.entries()) {
            if (voteRecord.createdAt < cutoffDate) {
                this.votes.delete(voteId);
                removed++;
            }
        }

        if (removed > 0) {
            log(`[VotingEngine] 清理了 ${removed} 个过期投票`, 'INFO');
        }
    }
}

export const votingEngine = new VotingEngine();
