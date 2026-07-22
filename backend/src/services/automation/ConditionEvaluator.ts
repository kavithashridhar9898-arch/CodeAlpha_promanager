export class ConditionEvaluator {
  
  static async evaluate(config: any, contextData: any): Promise<boolean> {
    if (!config || !config.rules) return true; // No conditions = true
    
    // config.rules could be an array of conditions
    // config.operator could be 'AND' or 'OR'
    const operator = config.operator || 'AND';
    const rules: any[] = config.rules;

    if (operator === 'AND') {
      for (const rule of rules) {
        if (!this.evaluateRule(rule, contextData)) return false;
      }
      return true;
    } else {
      // OR
      for (const rule of rules) {
        if (this.evaluateRule(rule, contextData)) return true;
      }
      return rules.length === 0;
    }
  }

  private static evaluateRule(rule: any, contextData: any): boolean {
    const { field, operator, value } = rule;
    
    // Extact actual value from context using dot notation (e.g., 'task.priority')
    const actualValue = this.getValueFromPath(contextData, field);

    switch (operator) {
      case 'EQUALS':
        return actualValue === value;
      case 'NOT_EQUALS':
        return actualValue !== value;
      case 'CONTAINS':
        return String(actualValue).includes(String(value));
      case 'GREATER_THAN':
        return Number(actualValue) > Number(value);
      case 'LESS_THAN':
        return Number(actualValue) < Number(value);
      case 'IN':
        return Array.isArray(value) && value.includes(actualValue);
      default:
        return false;
    }
  }

  private static getValueFromPath(obj: any, path: string): any {
    if (!path) return undefined;
    return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
  }
}
