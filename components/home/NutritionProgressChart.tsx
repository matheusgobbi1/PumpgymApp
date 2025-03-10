import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../context/ThemeContext';
import Colors from '../../constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { format, subDays, eachDayOfInterval, isFirstDayOfMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMeals } from '../../context/MealContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type Period = '7d' | '14d' | '30d';

interface NutritionProgressChartProps {
  onPress?: () => void;
  refreshKey?: number; // Prop para forçar atualização
}

export default function NutritionProgressChart({ onPress, refreshKey = 0 }: NutritionProgressChartProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { meals, getDayTotals } = useMeals();
  
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('7d');
  const [caloriesData, setCaloriesData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animação para a altura do card
  const cardHeight = useSharedValue(250);
  
  // Efeito para animar a altura do card quando expandido/recolhido
  useEffect(() => {
    cardHeight.value = withTiming(isExpanded ? 500 : 240, { duration: 300 });
  }, [isExpanded]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value,
    };
  });

  // Função para processar dados sem alterar a data selecionada no contexto
  const processData = useCallback(async () => {
    setIsLoading(true);
    
    const today = new Date();
    let daysToSubtract = 0;
    
    // Determinar quantos dias subtrair com base no período
    switch (selectedPeriod) {
      case '7d':
        daysToSubtract = 6; // 7 dias (hoje + 6 dias anteriores)
        break;
      case '14d':
        daysToSubtract = 13; // 14 dias (hoje + 13 dias anteriores)
        break;
      case '30d':
        daysToSubtract = 29; // 30 dias (hoje + 29 dias anteriores)
        break;
    }
    
    // Gerar intervalo de datas
    const startDate = subDays(today, daysToSubtract);
    const dateInterval = eachDayOfInterval({ start: startDate, end: today });
    
    // Formatar datas para labels e obter dados de calorias
    const newLabels: string[] = [];
    const newCaloriesData: number[] = [];
    
    // Processar cada data no intervalo
    for (let i = 0; i < dateInterval.length; i++) {
      const date = dateInterval[i];
      // Formatar a data para o formato yyyy-MM-dd (usado no contexto de refeições)
      const dateKey = format(date, 'yyyy-MM-dd');
      
      // Formatar a data para exibição no gráfico
      let displayFormat = '';
      
      if (selectedPeriod === '7d') {
        // Para 7 dias, mostrar o dia da semana abreviado
        displayFormat = format(date, 'EEE', { locale: ptBR }).substring(0, 3);
      } else if (selectedPeriod === '14d') {
        // Para 14 dias, mostrar apenas alguns dias para evitar amontoamento
        // Mostrar a cada 2 dias ou dias específicos
        if (i % 2 === 0 || i === dateInterval.length - 1) {
          displayFormat = format(date, 'dd/MM');
        } else {
          displayFormat = ''; // Rótulo vazio para dias intermediários
        }
      } else {
        // Para 30 dias, mostrar apenas dias específicos
        // Mostrar o primeiro dia do mês, a cada 5 dias e o último dia
        if (isFirstDayOfMonth(date) || getDate(date) % 5 === 0 || i === dateInterval.length - 1) {
          displayFormat = format(date, 'dd/MM');
        } else {
          displayFormat = ''; // Rótulo vazio para dias intermediários
        }
      }
      
      newLabels.push(displayFormat);
      
      // Verificar se há dados para esta data
      const hasMealsForDate = meals[dateKey] && Object.keys(meals[dateKey]).length > 0;
      
      // Obter calorias totais para o dia
      // Importante: Não alteramos a data selecionada no contexto
      let dayCalories = 0;
      
      if (hasMealsForDate) {
        // Calcular calorias manualmente para esta data
        const mealsForDate = meals[dateKey];
        let totalCalories = 0;
        
        Object.values(mealsForDate).forEach((foods: any) => {
          foods.forEach((food: any) => {
            if (food && food.calories) {
              totalCalories += food.calories * (food.quantity || 1);
            }
          });
        });
        
        dayCalories = totalCalories;
      }
      
      newCaloriesData.push(dayCalories);
    }
    
    setLabels(newLabels);
    setCaloriesData(newCaloriesData);
    setIsLoading(false);
  }, [selectedPeriod, meals]);

  // Efeito para carregar dados quando o período mudar ou quando houver atualização
  useEffect(() => {
    processData();
  }, [processData, refreshKey]);

  // Calcular estatísticas
  const averageCalories = caloriesData.length > 0 
    ? Math.round(caloriesData.reduce((sum, val) => sum + val, 0) / caloriesData.length) 
    : 0;
  
  const maxCalories = caloriesData.length > 0 
    ? Math.max(...caloriesData) 
    : 0;
    
  const todayCalories = caloriesData.length > 0
    ? caloriesData[caloriesData.length - 1]
    : 0;

  // Configurar o gráfico com base no período selecionado
  const getChartConfig = () => {
    // Configuração base
    const baseConfig = {
      backgroundColor: colors.chartBackground,
      backgroundGradientFrom: colors.chartGradientStart,
      backgroundGradientTo: colors.chartGradientEnd,
      decimalPlaces: 0,
      color: () => colors.primary,
      labelColor: () => colors.text + '80',
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '5',
        strokeWidth: '2',
        stroke: colors.primary,
        fill: colors.chartDotFill,
      },
      fillShadowGradientFrom: colors.primary,
      fillShadowGradientTo: 'rgba(255, 255, 255, 0)',
      propsForBackgroundLines: {
        strokeDasharray: '5, 5',
        stroke: colors.chartGrid,
      },
    };

    // Ajustes específicos para cada período
    if (selectedPeriod === '7d') {
      return {
        ...baseConfig,
        // Configuração padrão para 7 dias
      };
    } else if (selectedPeriod === '14d') {
      return {
        ...baseConfig,
        // Reduzir o tamanho da fonte para 14 dias
        labelFontSize: 10,
      };
    } else {
      return {
        ...baseConfig,
        // Reduzir ainda mais o tamanho da fonte para 30 dias
        labelFontSize: 9,
        // Rotacionar os rótulos para economizar espaço
        formatXLabel: (label: string) => label,
      };
    }
  };
  
  // Função para alternar entre expandido e recolhido
  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  // Função para mudar o período selecionado
  const handlePeriodChange = (period: Period) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPeriod(period);
  };

  return (
    <Animated.View 
      entering={FadeIn.duration(500)}
      style={[
        styles.container, 
        { backgroundColor: colors.light },
        animatedStyle
      ]}
    >
      <Pressable 
        style={styles.pressableArea}
        onPress={toggleExpand}
        android_ripple={{ color: colors.text + '10', borderless: true }}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <MaterialCommunityIcons name="fire" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Calorias Diárias</Text>
              <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
                {selectedPeriod === '7d' ? 'Últimos 7 dias' : 
                 selectedPeriod === '14d' ? 'Últimos 14 dias' : 'Último mês'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.infoButton, { backgroundColor: colors.primary + '20' }]}
              onPress={onPress}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.expandButton, { backgroundColor: colors.text + '10' }]}
              onPress={toggleExpand}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.text + '80'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Seletor de período - sempre visível */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === '7d' && [styles.selectedPeriod, { backgroundColor: colors.primary + '20' }]
            ]}
            onPress={() => handlePeriodChange('7d')}
          >
            <Text 
              style={[
                styles.periodText, 
                { color: colors.text + '80' },
                selectedPeriod === '7d' && { color: colors.primary, fontWeight: '600' }
              ]}
            >
              7 dias
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === '14d' && [styles.selectedPeriod, { backgroundColor: colors.primary + '20' }]
            ]}
            onPress={() => handlePeriodChange('14d')}
          >
            <Text 
              style={[
                styles.periodText, 
                { color: colors.text + '80' },
                selectedPeriod === '14d' && { color: colors.primary, fontWeight: '600' }
              ]}
            >
              14 dias
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === '30d' && [styles.selectedPeriod, { backgroundColor: colors.primary + '20' }]
            ]}
            onPress={() => handlePeriodChange('30d')}
          >
            <Text 
              style={[
                styles.periodText, 
                { color: colors.text + '80' },
                selectedPeriod === '30d' && { color: colors.primary, fontWeight: '600' }
              ]}
            >
              Mês
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Cards de estatísticas - sempre visíveis */}
        <View style={styles.statsContainer}>
          <MotiView
            style={[
              styles.statCard,
              { backgroundColor: colors.card }
            ]}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
          >
            <Text style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>Hoje</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {todayCalories} <Text style={[styles.statUnit, { color: colors.text + '60' }]}>kcal</Text>
            </Text>
          </MotiView>

          <MotiView
            style={[
              styles.statCard,
              { backgroundColor: colors.card }
            ]}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
          >
            <Text style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>Média</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {averageCalories} <Text style={[styles.statUnit, { color: colors.text + '60' }]}>kcal</Text>
            </Text>
          </MotiView>

          <MotiView
            style={[
              styles.statCard,
              { backgroundColor: colors.card }
            ]}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 500 }}
          >
            <Text style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>Máximo</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {maxCalories} <Text style={[styles.statUnit, { color: colors.text + '60' }]}>kcal</Text>
            </Text>
          </MotiView>
        </View>
        
        {/* Indicador de expansão */}
        {!isExpanded && (
          <View style={styles.expandIndicator}>
            <View style={[styles.expandDot, { backgroundColor: colors.primary + '40' }]} />
            <View style={[styles.expandDot, { backgroundColor: colors.primary + '40' }]} />
            <View style={[styles.expandDot, { backgroundColor: colors.primary + '40' }]} />
          </View>
        )}
      </Pressable>
      
      {/* Conteúdo expandido - visível apenas quando expandido */}
      {isExpanded && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.expandedContent}
        >
          <View style={styles.expandedSection}>
            <View style={styles.sectionDivider} />
            
            <View style={styles.expandedHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Evolução de Calorias
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.text + '60' }]}>
                {selectedPeriod === '7d' ? 'Últimos 7 dias' : 
                 selectedPeriod === '14d' ? 'Últimas 2 semanas' : 'Último mês'}
              </Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.text + '60' }]}>Carregando dados...</Text>
              </View>
            ) : caloriesData.every(cal => cal === 0) ? (
              <View style={[styles.emptyContainer, {
                backgroundColor: colors.chartBackground,
                borderRadius: 16,
                elevation: 3,
                padding: 20,
                margin: 16,
                paddingTop: 0,
                justifyContent: 'center',
              }]}>
                <View style={styles.emptyContentWrapper}>
                  <Ionicons 
                    name="restaurant-outline" 
                    size={36} 
                    color={colors.primary + '60'} 
                    style={{ marginBottom: 8 }} 
                  />
                  <Text style={[
                    styles.emptyText, 
                    { 
                      color: colors.text + '80', 
                      fontWeight: '600',
                      marginBottom: 2 // Reduzir o espaçamento inferior
                    }
                  ]}>
                    Nenhum dado de calorias encontrado
                  </Text>
                  <Text style={[
                    styles.emptySubText, 
                    { 
                      color: colors.text + '60',
                      marginBottom: 12 // Reduzir o espaçamento inferior
                    }
                  ]}>
                    Registre suas refeições para visualizar seu progresso
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.addButton, 
                      { 
                        backgroundColor: colors.dark,
                        paddingVertical: 10, // Reduzir a altura do botão
                        marginTop: 2 // Ajustar a margem superior
                      }
                    ]}
                    onPress={onPress}
                  >
                    <Text style={styles.addButtonText}>Registrar Refeição</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: labels,
                    datasets: [
                      {
                        data: caloriesData,
                        color: () => colors.primary,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={width - 40}
                  height={180}
                  chartConfig={getChartConfig()}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                    padding: 10,
                    backgroundColor: colors.chartBackground,
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  withInnerLines={false}
                  fromZero={true}
                  segments={4}
                />
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { 
                      backgroundColor: colors.primary,
                      borderWidth: 2,
                      borderColor: colors.primary,
                    }]} />
                    <Text style={[styles.legendText, { color: colors.text + '80' }]}>
                      Calorias diárias
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </MotiView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  selectedPeriod: {
    borderRadius: 10,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    height: 180,
  },
  emptyContentWrapper: {
    alignItems: 'center',
    paddingTop: 0,
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  expandedSection: {
    marginTop: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  expandedHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  expandIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  expandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2,
  },
  pressableArea: {
    width: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
}); 