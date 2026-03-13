/**
 * 智能体注册表
 * 负责管理IDE注册、大模型信息追踪、排行榜维护等
 */

import { log } from '../utils/logger.js';

export class AgentRegistry {
    constructor() {
        this.agents = new Map(); // 存储智能体信息
        this.models = new Map(); // 存储大模型信息
    }

    /**
     * 注册智能体
     * @param {string} ideId 智能体ID
     * @param {Object} agentInfo 智能体信息
     * @returns {string} 注册结果
     */
    registerAgent(ideId, agentInfo) {
        const requiredFields = ['name', 'model'];
        for (const field of requiredFields) {
            if (!agentInfo[field]) {
                throw new Error(`缺少必填字段: ${field}`);
            }
        }

        // 验证模型信息
        if (!agentInfo.model.primary) {
            throw new Error('缺少主要大模型信息');
        }

        this.agents.set(ideId, {
            ideId,
            name: agentInfo.name,
            model: {
                primary: agentInfo.model.primary,
                secondary: agentInfo.model.secondary || [],
                version: agentInfo.model.version || 'unknown'
            },
            registeredAt: new Date(),
            stats: {
                totalVotes: 0,
                avgScore: 0,
                participationRate: 0
            },
            updatedAt: new Date()
        });

        // 更新大模型信息
        this._updateModelInfo(agentInfo.model.primary, ideId);
        for (const secondaryModel of agentInfo.model.secondary) {
            this._updateModelInfo(secondaryModel, ideId);
        }

        log(`[AgentRegistry] 注册智能体: ${ideId} (${agentInfo.name}), 模型: ${agentInfo.model.primary}`, 'INFO');
        return `智能体 ${agentInfo.name} 注册成功`;
    }

    /**
     * 更新智能体信息
     * @param {string} ideId 智能体ID
     * @param {Object} agentInfo 更新的信息
     * @returns {string} 更新结果
     */
    updateAgent(ideId, agentInfo) {
        const agent = this.agents.get(ideId);
        if (!agent) {
            throw new Error('智能体不存在');
        }

        // 更新基本信息
        if (agentInfo.name) {
            agent.name = agentInfo.name;
        }

        // 更新模型信息
        if (agentInfo.model) {
            if (agentInfo.model.primary && agentInfo.model.primary !== agent.model.primary) {
                // 移除旧模型的关联
                this._removeModelAssociation(agent.model.primary, ideId);
                // 添加新模型的关联
                this._updateModelInfo(agentInfo.model.primary, ideId);
                agent.model.primary = agentInfo.model.primary;
            }

            if (agentInfo.model.secondary) {
                // 移除旧的次要模型关联
                for (const oldModel of agent.model.secondary) {
                    this._removeModelAssociation(oldModel, ideId);
                }
                // 添加新的次要模型关联
                for (const newModel of agentInfo.model.secondary) {
                    this._updateModelInfo(newModel, ideId);
                }
                agent.model.secondary = agentInfo.model.secondary;
            }

            if (agentInfo.model.version) {
                agent.model.version = agentInfo.model.version;
            }
        }

        agent.updatedAt = new Date();

        log(`[AgentRegistry] 更新智能体: ${ideId} (${agent.name})`, 'INFO');
        return `智能体 ${agent.name} 更新成功`;
    }

    /**
     * 获取智能体信息
     * @param {string} ideId 智能体ID
     * @returns {Object} 智能体信息
     */
    getAgent(ideId) {
        return this.agents.get(ideId);
    }

    /**
     * 获取所有智能体
     * @returns {Array} 智能体列表
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }

    /**
     * 获取大模型信息
     * @param {string} modelName 模型名称
     * @returns {Object} 模型信息
     */
    getModel(modelName) {
        return this.models.get(modelName);
    }

    /**
     * 获取所有大模型
     * @returns {Array} 大模型列表
     */
    getAllModels() {
        return Array.from(this.models.values());
    }

    /**
     * 更新智能体统计信息
     * @param {string} ideId 智能体ID
     * @param {Object} stats 更新的统计信息
     */
    updateAgentStats(ideId, stats) {
        const agent = this.agents.get(ideId);
        if (!agent) {
            throw new Error('智能体不存在');
        }

        if (stats.totalVotes !== undefined) {
            agent.stats.totalVotes = stats.totalVotes;
        }

        if (stats.avgScore !== undefined) {
            agent.stats.avgScore = stats.avgScore;
        }

        if (stats.participationRate !== undefined) {
            agent.stats.participationRate = stats.participationRate;
        }

        agent.updatedAt = new Date();

        log(`[AgentRegistry] 更新智能体统计: ${ideId} (${agent.name})`, 'INFO');
    }

    /**
     * 生成IDE排行榜
     * @returns {Array} 排行榜列表
     */
    generateIDERanking() {
        const agents = this.getAllAgents();
        
        // 计算综合得分
        const rankedAgents = agents.map(agent => {
            // 维度权重：历史评分40%，投票参与度30%，响应速度15%，协作质量15%
            const score = (
                agent.stats.avgScore * 0.4 +
                agent.stats.participationRate * 0.3 +
                (agent.responseSpeed || 0) * 0.15 +
                (agent.collaborationQuality || 0) * 0.15
            ) * 10;

            return {
                ...agent,
                score: Math.round(score * 10) / 10
            };
        });

        // 按得分排序
        rankedAgents.sort((a, b) => b.score - a.score);

        return rankedAgents;
    }

    /**
     * 生成大模型排行榜
     * @returns {Array} 排行榜列表
     */
    generateModelRanking() {
        const models = this.getAllModels();
        
        // 计算综合得分
        const rankedModels = models.map(model => {
            // 维度权重：平均得分35%，投票参与度30%，稳定性20%，响应速度15%
            const score = (
                (model.avgScore || 0) * 0.35 +
                (model.participationRate || 0) * 0.3 +
                (model.stability || 0) * 0.2 +
                (model.responseSpeed || 0) * 0.15
            ) * 10;

            return {
                ...model,
                score: Math.round(score * 10) / 10
            };
        });

        // 按得分排序
        rankedModels.sort((a, b) => b.score - a.score);

        return rankedModels;
    }

    /**
     * 更新大模型信息
     * @param {string} modelName 模型名称
     * @param {string} ideId 智能体ID
     * @private
     */
    _updateModelInfo(modelName, ideId) {
        let model = this.models.get(modelName);
        if (!model) {
            model = {
                name: modelName,
                usedBy: new Set(),
                avgScore: 0,
                participationRate: 0,
                stability: 0,
                responseSpeed: 0,
                updatedAt: new Date()
            };
            this.models.set(modelName, model);
        }

        model.usedBy.add(ideId);
        model.updatedAt = new Date();
    }

    /**
     * 移除大模型关联
     * @param {string} modelName 模型名称
     * @param {string} ideId 智能体ID
     * @private
     */
    _removeModelAssociation(modelName, ideId) {
        const model = this.models.get(modelName);
        if (model) {
            model.usedBy.delete(ideId);
            // 如果没有智能体使用该模型，删除模型记录
            if (model.usedBy.size === 0) {
                this.models.delete(modelName);
            } else {
                model.updatedAt = new Date();
            }
        }
    }
}

export const agentRegistry = new AgentRegistry();
