/**
 * Password management utilities.
 */

export interface PasswordStrengthResult {
  score: number; // 0-4
  label: "Muito fraca" | "Fraca" | "Razoável" | "Forte" | "Muito forte";
  suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push("Use pelo menos 8 caracteres");

  if (password.length >= 12) score++;

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else suggestions.push("Misture letras maiúsculas e minúsculas");

  if (/\d/.test(password)) score++;
  else suggestions.push("Adicione números");

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  else suggestions.push("Adicione caracteres especiais");

  // Penalize common patterns
  if (/^(123|abc|qwerty|password|admin)/i.test(password)) {
    score = Math.max(0, score - 2);
    suggestions.push("Evite padrões comuns");
  }

  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push("Evite caracteres repetidos");
  }

  const labels: PasswordStrengthResult["label"][] = [
    "Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"
  ];

  return {
    score: Math.min(4, score),
    label: labels[Math.min(4, score)],
    suggestions,
  };
}

export function generateSecurePassword(length = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => charset[b % charset.length]).join("");
}
