export const ValidationRules = {
  AGE: {
    MIN: 14,
    MAX: 100,
  },
  HEIGHT: {
    MIN: 120, // cm
    MAX: 250, // cm
  },
  WEIGHT: {
    MIN: 30, // kg
    MAX: 300, // kg
  },
  WEIGHT_CHANGE: {
    MIN_PERCENT: -20, // % do peso atual
    MAX_PERCENT: 20, // % do peso atual
  },
};

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

// Função auxiliar para calcular idade
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

export const validateBirthDate = (birthDate: Date): ValidationResult => {
  const age = calculateAge(birthDate);

  if (age < ValidationRules.AGE.MIN) {
    return {
      isValid: false,
      message: `Você precisa ter pelo menos ${ValidationRules.AGE.MIN} anos para usar o app`,
    };
  }

  if (age > ValidationRules.AGE.MAX) {
    return {
      isValid: false,
      message: `A idade máxima permitida é ${ValidationRules.AGE.MAX} anos`,
    };
  }

  return { isValid: true, message: "" };
};

export const validateHeight = (height: number): ValidationResult => {
  if (!height || isNaN(height)) {
    return {
      isValid: false,
      message: "Por favor, insira uma altura válida",
    };
  }

  if (
    height < ValidationRules.HEIGHT.MIN ||
    height > ValidationRules.HEIGHT.MAX
  ) {
    return {
      isValid: false,
      message: `A altura deve estar entre ${ValidationRules.HEIGHT.MIN} e ${ValidationRules.HEIGHT.MAX}cm`,
    };
  }

  return { isValid: true, message: "" };
};

export const validateWeight = (weight: number): ValidationResult => {
  if (!weight || isNaN(weight)) {
    return {
      isValid: false,
      message: "Por favor, insira um peso válido",
    };
  }

  if (
    weight < ValidationRules.WEIGHT.MIN ||
    weight > ValidationRules.WEIGHT.MAX
  ) {
    return {
      isValid: false,
      message: `O peso deve estar entre ${ValidationRules.WEIGHT.MIN} e ${ValidationRules.WEIGHT.MAX}kg`,
    };
  }

  return { isValid: true, message: "" };
};

export const validateWeightGoal = (
  currentWeight: number,
  targetWeight: number
): ValidationResult => {
  if (!targetWeight || isNaN(targetWeight)) {
    return {
      isValid: false,
      message: "Por favor, insira um peso meta válido",
    };
  }

  const percentChange = ((targetWeight - currentWeight) / currentWeight) * 100;

  if (
    percentChange < ValidationRules.WEIGHT_CHANGE.MIN_PERCENT ||
    percentChange > ValidationRules.WEIGHT_CHANGE.MAX_PERCENT
  ) {
    return {
      isValid: false,
      message: `A meta deve estar entre ${ValidationRules.WEIGHT_CHANGE.MIN_PERCENT}% e +${ValidationRules.WEIGHT_CHANGE.MAX_PERCENT}% do seu peso atual`,
    };
  }

  return { isValid: true, message: "" };
};

// Função para validar todas as medidas de uma vez
export const validateMeasurements = (
  height: number,
  weight: number
): ValidationResult => {
  const heightValidation = validateHeight(height);
  if (!heightValidation.isValid) return heightValidation;

  const weightValidation = validateWeight(weight);
  if (!weightValidation.isValid) return weightValidation;

  return { isValid: true, message: "" };
};

// Validações para registro
export const validateRegistration = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!name || !email || !password || !confirmPassword) {
    return {
      isValid: false,
      message: "Por favor, preencha todos os campos",
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: "As senhas não coincidem",
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: "A senha deve ter pelo menos 6 caracteres",
    };
  }

  return { isValid: true, message: "" };
};

// Validações para login
export const validateLogin = (
  email: string,
  password: string
): ValidationResult => {
  if (!email || !password) {
    return {
      isValid: false,
      message: "Por favor, preencha todos os campos",
    };
  }

  return { isValid: true, message: "" };
};

// Validação de força da senha
export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 0.25;
  if (/[A-Z]/.test(password)) strength += 0.25;
  if (/[0-9]/.test(password)) strength += 0.25;
  if (/[^A-Za-z0-9]/.test(password)) strength += 0.25;
  return strength;
};

export const getPasswordStrengthColor = (strength: number): string => {
  if (strength <= 0.25) return "#FF5252";
  if (strength <= 0.5) return "#FFC107";
  if (strength <= 0.75) return "#2196F3";
  return "#4CAF50";
};

export const getPasswordStrengthText = (strength: number): string => {
  if (strength <= 0.25) return "Fraca";
  if (strength <= 0.5) return "Média";
  if (strength <= 0.75) return "Boa";
  return "Forte";
};
