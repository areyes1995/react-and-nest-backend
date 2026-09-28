import { jsonConfig } from './json-config'

export interface ValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
}

export async function validateModule(module: Record<string, unknown>): Promise<ValidationResult> {
  const schema = await jsonConfig.getSettingsSchema()
  const moduleSchema = schema?.module
  const errors: Array<{ field: string; message: string }> = []

  if (!moduleSchema) {
    return { valid: false, errors: [{ field: 'schema', message: 'No validation schema available' }] }
  }

  for (const [field, rules] of Object.entries(moduleSchema)) {
    const value = module[field]
    const fieldRules = rules as any

    if (field === 'viewOptions' || field === 'columns') {
      if (fieldRules.required && (!Array.isArray(value) || value.length === 0)) {
        errors.push({ field, message: `${field} is required and cannot be empty` })
      }

      if (Array.isArray(value)) {
        const itemSchema = fieldRules.itemSchema
        if (itemSchema) {
          for (let i = 0; i < value.length; i++) {
            const item = value[i]
            for (const [itemField, itemRules] of Object.entries(itemSchema)) {
              const itemValue = item[itemField]
              const rule = itemRules as any
              const err = validateField(rule, itemField, itemValue)
              if (err) {
                errors.push({ field: `${field}[${i}].${itemField}`, message: err })
              }
            }
          }
        }
      }
      continue
    }

    const err = validateField(fieldRules, field, value)
    if (err) {
      errors.push({ field, message: err })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function validateField(rules: any, field: string, value: any): string | null {
  if (!rules) return null

  if (rules.required && (value === undefined || value === null || value === '')) {
    return `${field} is required`
  }

  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `${field} must be at least ${rules.minLength} characters`
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${field} must be at most ${rules.maxLength} characters`
    }
    if (rules.pattern) {
      const regex = new RegExp(rules.pattern)
      if (!regex.test(value)) {
        return rules.message || `${field} contains invalid characters`
      }
    }
    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
      return rules.message || `${field} has an invalid value`
    }
  }

  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return `${field} must be at least ${rules.min}`
    }
    if (rules.max !== undefined && value > rules.max) {
      return `${field} must be at most ${rules.max}`
    }
  }

  return null
}
