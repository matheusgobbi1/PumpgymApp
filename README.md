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

## Sistema de Sugestões Nutricionais

O aplicativo agora inclui um sistema de sugestões nutricionais que funciona como um nutricionista digital:

- Baseado nos dados do perfil nutricional do usuário obtidos no onboarding (calorias e macronutrientes)
- Sugere alimentos e porções adequadas para cada refeição
- Permite personalizar e substituir alimentos mantendo o equilíbrio nutricional
- Distribui automaticamente os macronutrientes diários entre as refeições

### Componentes principais:

1. **Banco de dados de alimentos**
   - Categorias: proteínas, carboidratos, gorduras, frutas, vegetais
   - Valores nutricionais e porções padrão
   - Sistema de substituições para diversidade alimentar

2. **Algoritmo de sugestão**
   - Calcula distribuição de macronutrientes para cada tipo de refeição
   - Sugere combinações adequadas de alimentos
   - Ajusta porções para atingir os valores nutricionais ideais

3. **Interface de usuário**
   - Botão de sugestão em cada refeição
   - Modal de visualização de sugestões
   - Interface intuitiva para personalizar as sugestões
   - Opções de substituição de alimentos

### Como usar:

1. Preencha o perfil nutricional no onboarding
2. Toque no botão de sugestão (ícone de nutrição) em qualquer refeição
3. Visualize a sugestão personalizada
4. Ajuste porções ou substitua alimentos conforme necessário
5. Aplique a sugestão à sua refeição 