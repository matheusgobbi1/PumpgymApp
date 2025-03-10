/// <reference types="jest" />

import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRegistrationStep1,
  validateRegistrationStep2,
  validateRegistration,
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText,
} from "../validations";

describe("Validações de Registro", () => {
  // Testes para validação de nome
  describe("validateName", () => {
    it("deve retornar erro para nome vazio", () => {
      const result = validateName("");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("insira seu nome");
    });

    it("deve retornar erro para nome muito curto", () => {
      const result = validateName("Ab");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("pelo menos");
    });

    it("deve retornar erro para nome com caracteres inválidos", () => {
      const result = validateName("João123");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("apenas letras e espaços");
    });

    it("deve aceitar nome válido", () => {
      const result = validateName("João Silva");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    it("deve aceitar nome com acentos", () => {
      const result = validateName("José Antônio da Silva");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });
  });

  // Testes para validação de email
  describe("validateEmail", () => {
    it("deve retornar erro para email vazio", () => {
      const result = validateEmail("");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("insira seu email");
    });

    it("deve retornar erro para email inválido", () => {
      const result = validateEmail("email.invalido");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("email válido");
    });

    it("deve retornar erro para email com domínio suspeito", () => {
      const result = validateEmail("usuario@dd.com");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("email válido e não temporário");
    });

    it("deve retornar erro para email com domínio muito curto", () => {
      const result = validateEmail("usuario@xy.com");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("domínio de email válido");
    });

    it("deve retornar erro para email que parece aleatório", () => {
      const result = validateEmail("abc123@gmail.com");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("email válido e não temporário");
    });

    it("deve aceitar email válido", () => {
      const result = validateEmail("usuario@exemplo.com");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    it("deve aceitar email com domínio comum", () => {
      const result = validateEmail("usuario@gmail.com");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });
  });

  // Testes para validação de senha
  describe("validatePassword", () => {
    it("deve retornar erro para senha vazia", () => {
      const result = validatePassword("");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("insira uma senha");
    });

    it("deve retornar erro para senha muito curta", () => {
      const result = validatePassword("123");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("pelo menos");
    });

    it("deve retornar erro para senha sem letra maiúscula", () => {
      const result = validatePassword("senha123!");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("letra maiúscula");
    });

    it("deve retornar erro para senha sem letra minúscula", () => {
      const result = validatePassword("SENHA123!");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("letra minúscula");
    });

    it("deve retornar erro para senha sem número", () => {
      const result = validatePassword("Senha!");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("número");
    });

    it("deve retornar erro para senha sem caractere especial", () => {
      const result = validatePassword("Senha123");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("caractere especial");
    });

    it("deve aceitar senha válida", () => {
      const result = validatePassword("Senha123!");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });
  });

  // Testes para validação de confirmação de senha
  describe("validatePasswordConfirmation", () => {
    it("deve retornar erro para confirmação vazia", () => {
      const result = validatePasswordConfirmation("Senha123!", "");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("confirme sua senha");
    });

    it("deve retornar erro para senhas diferentes", () => {
      const result = validatePasswordConfirmation("Senha123!", "Senha456!");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("não coincidem");
    });

    it("deve aceitar confirmação válida", () => {
      const result = validatePasswordConfirmation("Senha123!", "Senha123!");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });
  });

  // Testes para validação de etapas do registro
  describe("validateRegistrationStep1", () => {
    it("deve validar a primeira etapa corretamente", () => {
      const result = validateRegistrationStep1("João Silva", "joao@exemplo.com");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    it("deve falhar com nome inválido", () => {
      const result = validateRegistrationStep1("", "joao@exemplo.com");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("nome");
    });

    it("deve falhar com email inválido", () => {
      const result = validateRegistrationStep1("João Silva", "email-invalido");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("email");
    });
  });

  describe("validateRegistrationStep2", () => {
    it("deve validar a segunda etapa corretamente", () => {
      const result = validateRegistrationStep2("Senha123!", "Senha123!");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    it("deve falhar com senha inválida", () => {
      const result = validateRegistrationStep2("123", "123");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("pelo menos");
    });

    it("deve falhar com confirmação diferente", () => {
      const result = validateRegistrationStep2("Senha123!", "Senha456!");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("não coincidem");
    });
  });

  // Testes para validação completa do registro
  describe("validateRegistration", () => {
    it("deve validar registro completo corretamente", () => {
      const result = validateRegistration(
        "João Silva",
        "joao@exemplo.com",
        "Senha123!",
        "Senha123!"
      );
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    it("deve falhar com dados inválidos", () => {
      const result = validateRegistration("", "", "", "");
      expect(result.isValid).toBe(false);
    });
  });

  // Testes para cálculo de força da senha
  describe("calculatePasswordStrength", () => {
    it("deve retornar 0 para senha vazia", () => {
      expect(calculatePasswordStrength("")).toBe(0);
    });

    it("deve retornar 0.25 para senha apenas com comprimento suficiente", () => {
      expect(calculatePasswordStrength("senhasenha")).toBe(0.25);
    });

    it("deve retornar 0.5 para senha com comprimento e maiúscula", () => {
      expect(calculatePasswordStrength("Senhasenha")).toBe(0.5);
    });

    it("deve retornar 0.75 para senha com comprimento, maiúscula e número", () => {
      expect(calculatePasswordStrength("Senha123")).toBe(0.75);
    });

    it("deve retornar 1 para senha completa", () => {
      expect(calculatePasswordStrength("Senha123!")).toBe(1);
    });
  });

  // Testes para cores e textos de força da senha
  describe("getPasswordStrengthColor e getPasswordStrengthText", () => {
    it("deve retornar cor e texto corretos para senha fraca", () => {
      expect(getPasswordStrengthColor(0.25)).toBe("#FF5252");
      expect(getPasswordStrengthText(0.25)).toBe("Fraca");
    });

    it("deve retornar cor e texto corretos para senha média", () => {
      expect(getPasswordStrengthColor(0.5)).toBe("#FFC107");
      expect(getPasswordStrengthText(0.5)).toBe("Média");
    });

    it("deve retornar cor e texto corretos para senha boa", () => {
      expect(getPasswordStrengthColor(0.75)).toBe("#2196F3");
      expect(getPasswordStrengthText(0.75)).toBe("Boa");
    });

    it("deve retornar cor e texto corretos para senha forte", () => {
      expect(getPasswordStrengthColor(1)).toBe("#4CAF50");
      expect(getPasswordStrengthText(1)).toBe("Forte");
    });
  });
}); 