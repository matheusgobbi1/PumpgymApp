# PumpgymApp - Aplicativo de Fitness e Nutrição

## Bottom Sheet Épico para Adicionar Refeições

### Visão Geral
Implementamos um sistema moderno e interativo para configuração de refeições no aplicativo. Em vez de mostrar refeições pré-definidas quando o usuário abre a tela de nutrição pela primeira vez, agora exibimos uma tela vazia com uma mensagem convidativa para configurar as refeições.

### Componentes Principais

#### 1. MealConfigSheet
Um bottom sheet moderno e interativo que permite ao usuário:
- Selecionar refeições pré-definidas (Café da Manhã, Almoço, Jantar, etc.)
- Adicionar refeições personalizadas com nome e ícone customizados
- Selecionar todas as refeições com um único toque
- Confirmar a seleção com feedback visual e tátil

#### 2. EmptyNutritionState
Uma tela vazia elegante que:
- Exibe uma mensagem explicativa sobre a configuração de refeições
- Mostra dicas sobre os benefícios de acompanhar a nutrição
- Apresenta um botão destacado para iniciar a configuração
- Usa animações suaves para melhorar a experiência do usuário

### Fluxo de Usuário
1. O usuário abre a tela de nutrição pela primeira vez
2. Vê a tela vazia com a mensagem para configurar refeições
3. Toca no botão "Configurar Refeições"
4. O bottom sheet surge com animação suave
5. O usuário seleciona as refeições desejadas
6. Ao confirmar, as refeições são adicionadas ao contexto
7. A tela de nutrição é atualizada mostrando as refeições configuradas

### Benefícios
- **Personalização**: O usuário configura apenas as refeições que realmente utiliza
- **Experiência do Usuário**: Interface moderna com animações e feedback tátil
- **Flexibilidade**: Suporte para refeições personalizadas além das pré-definidas
- **Simplicidade**: Fluxo intuitivo sem necessidade de navegar entre telas

### Tecnologias Utilizadas
- React Native com Expo
- Bottom Sheet Modal para interface deslizante
- Animações com Moti e Reanimated
- Feedback tátil com Haptics
- Gradientes e efeitos visuais com LinearGradient
- Contexto para gerenciamento de estado
- Firebase para persistência de dados

### Próximos Passos
- Implementar reordenação de refeições com gestos de arrastar
- Adicionar sugestões baseadas no perfil do usuário
- Permitir edição de refeições já configuradas
- Implementar visualização prévia das refeições no calendário 