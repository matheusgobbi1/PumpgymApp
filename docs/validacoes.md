# Documentação de Validações e Componente ErrorMessage

## Validações

O sistema de validações foi projetado para garantir que os dados inseridos pelos usuários sejam válidos antes de serem processados. As validações estão organizadas em funções específicas para cada tipo de dado e também em funções compostas para validar formulários completos.

### Principais Funções de Validação

- `validateName(name: string)`: Valida nomes de usuários
- `validateEmail(email: string)`: Valida endereços de email
- `validatePassword(password: string)`: Valida senhas conforme requisitos de segurança
- `validatePasswordConfirmation(password: string, confirmPassword: string)`: Verifica se a confirmação de senha corresponde à senha
- `validateRegistrationStep1(name: string, email: string)`: Valida a primeira etapa do registro
- `validateRegistrationStep2(password: string, confirmPassword: string)`: Valida a segunda etapa do registro
- `validateRegistration(name: string, email: string, password: string, confirmPassword: string)`: Valida o formulário de registro completo

### Regras de Validação

As regras de validação estão definidas no objeto `ValidationRules`:

```typescript
export const ValidationRules = {
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
    COMMON_DOMAINS: ["gmail.com", "hotmail.com", "outlook.com", /* ... */],
    SUSPICIOUS_DOMAINS: ["dd.com", "test.com", "example.com", /* ... */],
  },
  // ... outras regras
};
```

### Validação de Nome

A validação de nome verifica:
- Se o nome não está vazio
- Se o nome tem pelo menos o número mínimo de caracteres
- Se o nome não excede o número máximo de caracteres
- Se o nome contém apenas letras e espaços
- Se o nome completo foi fornecido (nome e sobrenome)
- Se cada parte do nome tem pelo menos 2 caracteres

### Validação de Email

A validação de email verifica:
- Se o email não está vazio
- Se o email tem um formato básico válido (usando regex)
- Se a parte local do email tem pelo menos 3 caracteres
- Se o domínio tem uma extensão válida
- Se o email não parece ser temporário ou aleatório
- Se o domínio não está na lista de domínios suspeitos
- Se o domínio não é muito curto (como "dd.com")

### Validação de Senha

A validação de senha verifica:
- Se a senha não está vazia
- Se a senha tem pelo menos o número mínimo de caracteres
- Se a senha contém pelo menos uma letra maiúscula
- Se a senha contém pelo menos uma letra minúscula
- Se a senha contém pelo menos um número
- Se a senha contém pelo menos um caractere especial

### Exemplo de Uso

```typescript
import { validateRegistrationStep1, validateRegistrationStep2 } from "../utils/validations";

// Validação da primeira etapa (nome e email)
const nextStep = () => {
  const validationResult = validateRegistrationStep1(name, email);
  if (!validationResult.isValid) {
    setError(validationResult.message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }
  
  // Continuar para a próxima etapa
  setFormStep(2);
};

// Validação da segunda etapa (senha e confirmação)
const handleCompleteRegistration = async () => {
  // Validar a segunda etapa
  const validationResult = validateRegistrationStep2(password, confirmPassword);
  if (!validationResult.isValid) {
    setError(validationResult.message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }
  
  // Validar o formulário completo
  const fullValidationResult = validateRegistration(name, email, password, confirmPassword);
  if (!fullValidationResult.isValid) {
    setError(fullValidationResult.message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }
  
  // Prosseguir com o registro
  await completeAnonymousRegistration(name, email, password);
};
```

## Componente ErrorMessage

O componente `ErrorMessage` é usado para exibir mensagens de erro de forma consistente em toda a aplicação.

### Propriedades

- `message: string`: A mensagem de erro a ser exibida

### Exemplo de Uso

```tsx
import { ErrorMessage } from "../../components/common/ErrorMessage";

// Em um componente React
const MyForm = () => {
  const [error, setError] = useState("");
  
  // ... lógica do formulário
  
  return (
    <View>
      {error ? <ErrorMessage message={error} /> : null}
      
      {/* Campos do formulário */}
    </View>
  );
};
```

### Características do ErrorMessage

- Animação de "shake" quando uma nova mensagem é exibida
- Estilo visual consistente com ícone de alerta
- Adaptação automática ao tema claro/escuro
- Não renderiza nada quando a mensagem está vazia

## Validação de Força de Senha

O sistema também inclui funções para calcular e exibir a força da senha:

- `calculatePasswordStrength(password: string)`: Retorna um valor entre 0 e 1 representando a força da senha
- `getPasswordStrengthColor(strength: number)`: Retorna uma cor baseada na força da senha
- `getPasswordStrengthText(strength: number)`: Retorna um texto descritivo da força da senha

### Exemplo de Uso da Validação de Força de Senha

```tsx
import {
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText
} from "../../utils/validations";

const PasswordField = () => {
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(calculatePasswordStrength(text));
  };
  
  return (
    <View>
      <Input
        label="Senha"
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry
      />
      
      {password.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBarContainer}>
            <View
              style={[
                styles.strengthBar,
                {
                  width: `${passwordStrength * 100}%`,
                  backgroundColor: getPasswordStrengthColor(passwordStrength),
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.strengthText,
              { color: getPasswordStrengthColor(passwordStrength) },
            ]}
          >
            {getPasswordStrengthText(passwordStrength)}
          </Text>
        </View>
      )}
    </View>
  );
};
```

## Boas Práticas

1. Sempre valide os dados antes de enviá-los para o servidor
2. Use o componente ErrorMessage para exibir erros de validação
3. Divida formulários longos em etapas e valide cada etapa separadamente
4. Forneça feedback visual sobre a força da senha para ajudar os usuários a criar senhas seguras
5. Mantenha as regras de validação centralizadas no objeto ValidationRules para facilitar ajustes futuros
6. Forneça feedback tátil (vibração) quando ocorrerem erros de validação
7. Valide tanto cada etapa individualmente quanto o formulário completo antes de enviar os dados 