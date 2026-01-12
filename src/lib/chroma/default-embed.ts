type EmbeddingConfig = Record<string, unknown>

export class DefaultEmbeddingFunction {
  name = 'default'

  static buildFromConfig(_config: EmbeddingConfig) {
    return new DefaultEmbeddingFunction()
  }

  async generate(_texts: string[]) {
    throw new Error('Default embedding is disabled. Provide a custom embedding function.')
  }

  defaultSpace() {
    return 'cosine'
  }

  supportedSpaces() {
    return ['cosine', 'l2', 'ip']
  }

  getConfig() {
    return {}
  }

  validateConfigUpdate() {
    return
  }

  static validateConfig() {
    return
  }
}
