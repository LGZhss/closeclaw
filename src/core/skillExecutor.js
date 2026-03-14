import fs from 'fs/promises';
import path from 'path';
import { WORKSPACE } from '../config/config.js';
import { runGit, executeSystemCommand, readWsFile, writeWsFile, fetchUrl } from '../utils/utils.js';
import { execAsync, execFileAsync } from '../utils/utils.js';
import { log } from '../utils/logger.js';

const SKILLS_BASE = path.join(process.cwd(), 'skills');

export class SkillExecutor {
  constructor() {
    this.registry = new Map();
  }

  async init() {
    await this.loadSkillRegistry();
  }

  async loadSkillRegistry() {
    try {
      const skillsFile = path.join(process.cwd(), '.skills.json');
      const content = await fs.readFile(skillsFile, 'utf8');
      const config = JSON.parse(content);

      const skillPromises = (config.skills || []).map(async (skill) => {
        const skillPath = path.join(SKILLS_BASE, skill.path.replace('skills/', ''));
        return skillPath;
      });
      await Promise.all(skillPromises);
    } catch (err) {
      log('Error loading skill registry:', err);
    }
  }
}