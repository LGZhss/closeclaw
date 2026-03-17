export class LLMAdapter {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * @param {Object} params
   * @param {string} params.systemInstruction
   * @param {Array} params.history
   * @param {string} params.message
   * @param {Array} [params.tools]
   * @param {string} params.preferredLevel - lite, flash, or pro
   * @returns {Promise<{text: string, level: string, model: string, functionCall?: Object}>}
   */
  async chat(params) {
    throw new Error('Method not implemented.');
  }
}
