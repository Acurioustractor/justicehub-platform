import OpenAI from 'openai'
import { knownEmbeddingFunctions, registerEmbeddingFunction } from 'chromadb'

type OpenAIEmbeddingConfig = {
  api_key_env_var?: string
  model_name?: string
  organization_id?: string | null
}

type OpenAIEmbeddingArgs = {
  apiKeyEnvVar?: string
  modelName?: string
  organizationId?: string | null
}

export class OpenAIEmbeddingFunction {
  name = 'openai'
  private apiKeyEnvVar: string
  private modelName: string
  private organizationId: string | null
  private client: OpenAI

  constructor(args: OpenAIEmbeddingArgs = {}) {
    this.apiKeyEnvVar = args.apiKeyEnvVar ?? 'OPENAI_API_KEY'
    this.modelName = args.modelName ?? 'text-embedding-3-small'
    this.organizationId = args.organizationId ?? null

    const apiKey = process.env[this.apiKeyEnvVar]
    if (!apiKey) {
      throw new Error(`Missing ${this.apiKeyEnvVar}`)
    }

    this.client = new OpenAI({
      apiKey,
      organization: this.organizationId ?? undefined,
    })
  }

  static buildFromConfig(config: OpenAIEmbeddingConfig) {
    return new OpenAIEmbeddingFunction({
      apiKeyEnvVar: config.api_key_env_var,
      modelName: config.model_name,
      organizationId: config.organization_id ?? null,
    })
  }

  async generate(texts: string[]) {
    const response = await this.client.embeddings.create({
      model: this.modelName,
      input: texts,
    })

    return response.data.map((item) => item.embedding)
  }

  defaultSpace() {
    return 'cosine'
  }

  supportedSpaces() {
    return ['cosine', 'l2', 'ip']
  }

  getConfig() {
    return {
      api_key_env_var: this.apiKeyEnvVar,
      model_name: this.modelName,
      organization_id: this.organizationId,
    }
  }

  validateConfigUpdate(newConfig: { model_name?: string }) {
    if (newConfig?.model_name && newConfig.model_name !== this.modelName) {
      throw new Error('The OpenAI embedding model cannot be changed after initialization.')
    }
  }

  static validateConfig(config: OpenAIEmbeddingConfig) {
    if (!config?.api_key_env_var || !config?.model_name) {
      throw new Error('OpenAI embedding config requires api_key_env_var and model_name.')
    }
  }
}

export const ensureOpenAIEmbeddingFunction = () => {
  if (!knownEmbeddingFunctions.has('openai')) {
    registerEmbeddingFunction('openai', OpenAIEmbeddingFunction)
  }
}
