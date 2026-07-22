export interface PromptTemplate {
  name: string;
  generate: (context: any) => string;
}

const templates: Record<string, PromptTemplate> = {};

export class PromptManager {
  static register(template: PromptTemplate) {
    templates[template.name] = template;
  }

  static get(name: string, context: any): string {
    const template = templates[name];
    if (!template) {
      throw new Error(`Prompt template '${name}' not found.`);
    }
    return template.generate(context);
  }
}

// Auto-register default templates
import './templates';
