import i18n from "../i18n";

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
  NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    REQUIRE_FULL_NAME: true, // Exigir nome completo (nome e sobrenome)
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  EMAIL: {
    COMMON_DOMAINS: [
      "gmail.com",
      "hotmail.com",
      "outlook.com",
      "yahoo.com",
      "icloud.com",
      "live.com",
      "uol.com.br",
      "bol.com.br",
      "globo.com",
      "terra.com.br",
    ],
    SUSPICIOUS_DOMAINS: [
      "dd.com",
      "test.com",
      "example.com",
      "temp.com",
      "fake.com",
      "mail.com",
      "email.com",
    ],
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
      message: i18n.t("onboarding.birthDate.validation.tooYoung"),
    };
  }

  if (age > ValidationRules.AGE.MAX) {
    return {
      isValid: false,
      message: i18n.t("onboarding.birthDate.validation.tooOld"),
    };
  }

  return { isValid: true, message: "" };
};

export const validateHeight = (height: number): ValidationResult => {
  if (!height || isNaN(height)) {
    return {
      isValid: false,
      message: i18n.t("onboarding.measurements.validation.invalidHeight"),
    };
  }

  if (
    height < ValidationRules.HEIGHT.MIN ||
    height > ValidationRules.HEIGHT.MAX
  ) {
    return {
      isValid: false,
      message: i18n.t("onboarding.measurements.validation.heightRange"),
    };
  }

  return { isValid: true, message: "" };
};

export const validateWeight = (weight: number): ValidationResult => {
  if (!weight || isNaN(weight)) {
    return {
      isValid: false,
      message: i18n.t("onboarding.measurements.validation.invalidWeight"),
    };
  }

  if (
    weight < ValidationRules.WEIGHT.MIN ||
    weight > ValidationRules.WEIGHT.MAX
  ) {
    return {
      isValid: false,
      message: i18n.t("onboarding.measurements.validation.weightRange"),
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
      message: i18n.t("onboarding.weightGoal.validation.invalidTargetWeight"),
    };
  }

  const percentChange = ((targetWeight - currentWeight) / currentWeight) * 100;

  if (
    percentChange < ValidationRules.WEIGHT_CHANGE.MIN_PERCENT ||
    percentChange > ValidationRules.WEIGHT_CHANGE.MAX_PERCENT
  ) {
    return {
      isValid: false,
      message: i18n.t("onboarding.weightGoal.validation.weightRangeError", {
        min: Math.abs(ValidationRules.WEIGHT_CHANGE.MIN_PERCENT),
        max: ValidationRules.WEIGHT_CHANGE.MAX_PERCENT,
      }),
    };
  }

  return { isValid: true, message: "" };
};

// Função para validar todas as medidas de uma vez
export const validateMeasurements = (
  height?: number,
  weight?: number
): ValidationResult => {
  if (!height || isNaN(height)) {
    return {
      isValid: false,
      message: i18n.t("onboarding.measurements.validation.invalidHeight"),
    };
  }

  if (!weight || isNaN(weight)) {
    return {
      isValid: false,
      message: i18n.t("onboarding.measurements.validation.invalidWeight"),
    };
  }

  const heightValidation = validateHeight(height);
  if (!heightValidation.isValid) return heightValidation;

  const weightValidation = validateWeight(weight);
  if (!weightValidation.isValid) return weightValidation;

  return { isValid: true, message: "" };
};

// Validação de nome
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim() === "") {
    return {
      isValid: false,
      message: "Por favor, insira seu nome",
    };
  }

  if (name.trim().length < ValidationRules.NAME.MIN_LENGTH) {
    return {
      isValid: false,
      message: `O nome deve ter pelo menos ${ValidationRules.NAME.MIN_LENGTH} caracteres`,
    };
  }

  if (name.trim().length > ValidationRules.NAME.MAX_LENGTH) {
    return {
      isValid: false,
      message: `O nome não pode ter mais de ${ValidationRules.NAME.MAX_LENGTH} caracteres`,
    };
  }

  // Verificar se o nome contém apenas letras e espaços
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(name.trim())) {
    return {
      isValid: false,
      message: "O nome deve conter apenas letras e espaços",
    };
  }

  // Verificar se o nome completo foi fornecido (nome e sobrenome)
  if (ValidationRules.NAME.REQUIRE_FULL_NAME) {
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return {
        isValid: false,
        message: "Por favor, insira seu nome completo (nome e sobrenome)",
      };
    }

    // Verificar se cada parte do nome tem pelo menos 2 caracteres
    for (const part of nameParts) {
      if (part.length < 2) {
        return {
          isValid: false,
          message: "Cada parte do seu nome deve ter pelo menos 2 caracteres",
        };
      }
    }
  }

  return { isValid: true, message: "" };
};

// Validação de email
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === "") {
    return {
      isValid: false,
      message: "Por favor, insira seu email",
    };
  }

  // Regex para validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      message: "Por favor, insira um email válido",
    };
  }

  // Validação mais rigorosa de email
  const emailParts = email.trim().split("@");
  if (emailParts.length !== 2) {
    return {
      isValid: false,
      message: "Formato de email inválido",
    };
  }

  const [localPart, domain] = emailParts;

  // Verificar se a parte local tem pelo menos 3 caracteres
  if (localPart.length < 3) {
    return {
      isValid: false,
      message: "A parte local do email deve ter pelo menos 3 caracteres",
    };
  }

  // Verificar se o domínio tem pelo menos uma extensão válida
  const domainParts = domain.split(".");
  if (domainParts.length < 2) {
    return {
      isValid: false,
      message: "Domínio de email inválido",
    };
  }

  // Verificar se a extensão do domínio tem pelo menos 2 caracteres
  const extension = domainParts[domainParts.length - 1];
  if (extension.length < 2) {
    return {
      isValid: false,
      message: "Extensão de domínio inválida",
    };
  }

  // Verificar se o email parece ser temporário ou aleatório
  // Isso é uma heurística simples e pode precisar ser ajustada
  const randomPatterns = [
    /^[a-z]{1,3}\d{1,3}@/i, // Padrões como abc123@
    /^test\d*@/i, // test, test1, test123, etc.
    /^temp\d*@/i, // temp, temp1, temp123, etc.
    /^user\d*@/i, // user, user1, user123, etc.
    /^[a-z]{1,2}[0-9]{1,2}[a-z]{1,2}@/i, // Padrões como a1b@, xy12z@
  ];

  for (const pattern of randomPatterns) {
    if (pattern.test(email)) {
      return {
        isValid: false,
        message: "Por favor, use um email válido e não temporário",
      };
    }
  }

  // Verificar se o domínio é suspeito
  const domainLower = domain.toLowerCase();
  if (ValidationRules.EMAIL.SUSPICIOUS_DOMAINS.includes(domainLower)) {
    return {
      isValid: false,
      message: "Por favor, use um email válido e não temporário",
    };
  }

  // Verificar se o domínio é muito curto (como dd.com)
  if (
    domainParts[0].length <= 2 &&
    !domainLower.endsWith(".co.uk") &&
    !domainLower.endsWith(".co.jp")
  ) {
    return {
      isValid: false,
      message: "Por favor, use um domínio de email válido",
    };
  }

  // Verificar se o domínio é comum (opcional, pode ser removido se for muito restritivo)
  if (
    !ValidationRules.EMAIL.COMMON_DOMAINS.includes(domainLower) &&
    !domainLower.endsWith(".edu") &&
    !domainLower.endsWith(".gov") &&
    !domainLower.endsWith(".org") &&
    !domainLower.endsWith(".com.br")
  ) {
    // Esta é apenas uma verificação suave, não bloqueia o registro
    console.warn(`Domínio de email não comum: ${domain}`);
    // Poderíamos adicionar uma verificação mais rigorosa aqui se necessário
  }

  return { isValid: true, message: "" };
};

// Validação de senha
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return {
      isValid: false,
      message: "Por favor, insira uma senha",
    };
  }

  if (password.length < ValidationRules.PASSWORD.MIN_LENGTH) {
    return {
      isValid: false,
      message: `A senha deve ter pelo menos ${ValidationRules.PASSWORD.MIN_LENGTH} caracteres`,
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const missingRequirements = [];

  if (ValidationRules.PASSWORD.REQUIRE_UPPERCASE && !hasUpperCase) {
    missingRequirements.push("letra maiúscula");
  }

  if (ValidationRules.PASSWORD.REQUIRE_LOWERCASE && !hasLowerCase) {
    missingRequirements.push("letra minúscula");
  }

  if (ValidationRules.PASSWORD.REQUIRE_NUMBER && !hasNumber) {
    missingRequirements.push("número");
  }

  if (ValidationRules.PASSWORD.REQUIRE_SPECIAL && !hasSpecial) {
    missingRequirements.push("caractere especial");
  }

  if (missingRequirements.length > 0) {
    return {
      isValid: false,
      message: `A senha deve conter pelo menos uma ${missingRequirements.join(
        ", uma "
      )}`,
    };
  }

  return { isValid: true, message: "" };
};

// Validação de confirmação de senha
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword) {
    return {
      isValid: false,
      message: "Por favor, confirme sua senha",
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: "As senhas não coincidem",
    };
  }

  return { isValid: true, message: "" };
};

// Validações para registro
export const validateRegistration = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): ValidationResult => {
  // Validar nome
  const nameValidation = validateName(name);
  if (!nameValidation.isValid) return nameValidation;

  // Validar email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return emailValidation;

  // Validar senha
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) return passwordValidation;

  // Validar confirmação de senha
  const confirmPasswordValidation = validatePasswordConfirmation(
    password,
    confirmPassword
  );
  if (!confirmPasswordValidation.isValid) return confirmPasswordValidation;

  return { isValid: true, message: "" };
};

// Validações para cada etapa do registro
export const validateRegistrationStep1 = (
  name: string,
  email: string
): ValidationResult => {
  // Validar nome
  const nameValidation = validateName(name);
  if (!nameValidation.isValid) return nameValidation;

  // Validar email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return emailValidation;

  return { isValid: true, message: "" };
};

export const validateRegistrationStep2 = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  // Validar senha
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) return passwordValidation;

  // Validar confirmação de senha
  const confirmPasswordValidation = validatePasswordConfirmation(
    password,
    confirmPassword
  );
  if (!confirmPasswordValidation.isValid) return confirmPasswordValidation;

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

  // Validar email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return emailValidation;

  if (!password) {
    return {
      isValid: false,
      message: "Por favor, insira sua senha",
    };
  }

  return { isValid: true, message: "" };
};

// Validação de força da senha
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;

  let strength = 0;

  // Comprimento da senha
  if (password.length >= ValidationRules.PASSWORD.MIN_LENGTH) strength += 0.25;

  // Letras maiúsculas
  if (/[A-Z]/.test(password)) strength += 0.25;

  // Números
  if (/[0-9]/.test(password)) strength += 0.25;

  // Caracteres especiais
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
  if (strength <= 0.25) return i18n.t("passwordStrength.weak");
  if (strength <= 0.5) return i18n.t("passwordStrength.medium");
  if (strength <= 0.75) return i18n.t("passwordStrength.good");
  return i18n.t("passwordStrength.strong");
};
