import zxcvbn from 'zxcvbn'
import {
  PasswordStrength,
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRENGTH_COLORS,
} from './password-policy'

/**
 * Password Strength Analysis
 */
export interface PasswordStrengthAnalysis {
  score: PasswordStrength
  label: string
  color: string
  percentage: number
  crackTime: string
  feedback: {
    warning: string
    suggestions: string[]
  }
}

/**
 * Password Strength Calculator
 * Real-time password strength analysis
 */
export class PasswordStrength {
  /**
   * Calculate password strength
   */
  static calculate(password: string, userInputs: string[] = []): PasswordStrengthAnalysis {
    if (!password) {
      return {
        score: PasswordStrength.VERY_WEAK,
        label: PASSWORD_STRENGTH_LABELS[PasswordStrength.VERY_WEAK],
        color: PASSWORD_STRENGTH_COLORS[PasswordStrength.VERY_WEAK],
        percentage: 0,
        crackTime: '0 segundos',
        feedback: {
          warning: 'Digite uma senha',
          suggestions: [],
        },
      }
    }

    const analysis = zxcvbn(password, userInputs)

    return {
      score: analysis.score as PasswordStrength,
      label: PASSWORD_STRENGTH_LABELS[analysis.score as PasswordStrength],
      color: PASSWORD_STRENGTH_COLORS[analysis.score as PasswordStrength],
      percentage: (analysis.score / 4) * 100,
      crackTime: this.formatCrackTime(
        analysis.crack_times_display.offline_slow_hashing_1e4_per_second
      ),
      feedback: {
        warning: this.translateWarning(analysis.feedback.warning),
        suggestions: analysis.feedback.suggestions.map((s) => this.translateSuggestion(s)),
      },
    }
  }

  /**
   * Get strength class for styling
   */
  static getStrengthClass(score: PasswordStrength): string {
    const classes = {
      [PasswordStrength.VERY_WEAK]: 'strength-very-weak',
      [PasswordStrength.WEAK]: 'strength-weak',
      [PasswordStrength.FAIR]: 'strength-fair',
      [PasswordStrength.STRONG]: 'strength-strong',
      [PasswordStrength.VERY_STRONG]: 'strength-very-strong',
    }

    return classes[score]
  }

  /**
   * Format crack time for display
   */
  private static formatCrackTime(crackTime: string): string {
    const translations: Record<string, string> = {
      'less than a second': 'menos de 1 segundo',
      'second': 'segundo',
      'seconds': 'segundos',
      'minute': 'minuto',
      'minutes': 'minutos',
      'hour': 'hora',
      'hours': 'horas',
      'day': 'dia',
      'days': 'dias',
      'month': 'mês',
      'months': 'meses',
      'year': 'ano',
      'years': 'anos',
      'century': 'século',
      'centuries': 'séculos',
    }

    let translated = crackTime
    Object.entries(translations).forEach(([en, pt]) => {
      translated = translated.replace(new RegExp(en, 'g'), pt)
    })

    return translated
  }

  /**
   * Translate zxcvbn warning to Portuguese
   */
  private static translateWarning(warning: string): string {
    if (!warning) return ''

    const translations: Record<string, string> = {
      'This is a top-10 common password': 'Esta é uma das 10 senhas mais comuns',
      'This is a top-100 common password': 'Esta é uma das 100 senhas mais comuns',
      'This is a very common password': 'Esta é uma senha muito comum',
      'This is similar to a commonly used password': 'Esta senha é similar a senhas comuns',
      'Straight rows of keys are easy to guess': 'Sequências de teclas são fáceis de adivinhar',
      'Short keyboard patterns are easy to guess': 'Padrões curtos de teclado são fáceis de adivinhar',
      'Repeats like "aaa" are easy to guess': 'Repetições como "aaa" são fáceis de adivinhar',
      'Repeats like "abcabcabc" are only slightly harder to guess than "abc"':
        'Repetições como "abcabcabc" são apenas um pouco mais difíceis que "abc"',
      'Sequences like "abc" or "6543" are easy to guess':
        'Sequências como "abc" ou "6543" são fáceis de adivinhar',
      'Recent years are easy to guess': 'Anos recentes são fáceis de adivinhar',
      'Dates are often easy to guess': 'Datas são geralmente fáceis de adivinhar',
    }

    return translations[warning] || warning
  }

  /**
   * Translate zxcvbn suggestion to Portuguese
   */
  private static translateSuggestion(suggestion: string): string {
    const translations: Record<string, string> = {
      'Use a few words, avoid common phrases': 'Use algumas palavras, evite frases comuns',
      'No need for symbols, digits, or uppercase letters': 'Não precisa de símbolos, números ou maiúsculas',
      'Add another word or two. Uncommon words are better.':
        'Adicione mais uma ou duas palavras. Palavras incomuns são melhores.',
      'Use a longer keyboard pattern with more turns': 'Use um padrão de teclado mais longo com mais variações',
      'Avoid repeated words and characters': 'Evite palavras e caracteres repetidos',
      'Avoid sequences': 'Evite sequências',
      'Avoid recent years': 'Evite anos recentes',
      'Avoid years that are associated with you': 'Evite anos associados a você',
      'Avoid dates and years that are associated with you': 'Evite datas e anos associados a você',
      'Capitalization doesn\'t help very much': 'Letras maiúsculas não ajudam muito',
      'All-uppercase is almost as easy to guess as all-lowercase':
        'Tudo maiúsculo é quase tão fácil quanto tudo minúsculo',
      'Reversed words aren\'t much harder to guess': 'Palavras invertidas não são muito mais difíceis',
      'Predictable substitutions like "@" instead of "a" don\'t help very much':
        'Substituições previsíveis como "@" no lugar de "a" não ajudam muito',
    }

    return translations[suggestion] || suggestion
  }
}
