import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import ButtonNew from '../components/common/ButtonNew';

export default function NotificationsModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  
  // Estados para os switches de notificações
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(true);
  const [goalAchievements, setGoalAchievements] = useState(true);
  
  // Função para voltar
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  // Função para alternar um switch com feedback tátil
  const toggleSwitch = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
  };
  
  // Função para salvar as configurações
  const handleSaveSettings = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Configurações Salvas",
      "Suas preferências de notificações foram atualizadas com sucesso.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Cabeçalho */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notificações</Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* Conteúdo */}
        <ScrollView style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferências de Notificações</Text>
          
          {/* Lembretes de Treino */}
          <View style={[styles.optionItem, { borderBottomColor: colors.border }]}>
            <View style={styles.optionInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="barbell-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Lembretes de Treino</Text>
                <Text style={[styles.optionDescription, { color: colors.text + '80' }]}>
                  Receba lembretes para seus treinos programados
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + '70' }}
              thumbColor={workoutReminders ? colors.primary : colors.text + '30'}
              ios_backgroundColor={colors.border}
              onValueChange={(value) => toggleSwitch(setWorkoutReminders, value)}
              value={workoutReminders}
            />
          </View>
          
          {/* Lembretes de Refeição */}
          <View style={[styles.optionItem, { borderBottomColor: colors.border }]}>
            <View style={styles.optionInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Lembretes de Refeição</Text>
                <Text style={[styles.optionDescription, { color: colors.text + '80' }]}>
                  Receba lembretes para suas refeições programadas
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + '70' }}
              thumbColor={mealReminders ? colors.primary : colors.text + '30'}
              ios_backgroundColor={colors.border}
              onValueChange={(value) => toggleSwitch(setMealReminders, value)}
              value={mealReminders}
            />
          </View>
          
          {/* Lembretes de Água */}
          <View style={[styles.optionItem, { borderBottomColor: colors.border }]}>
            <View style={styles.optionInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="water-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Lembretes de Água</Text>
                <Text style={[styles.optionDescription, { color: colors.text + '80' }]}>
                  Receba lembretes para beber água regularmente
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + '70' }}
              thumbColor={waterReminders ? colors.primary : colors.text + '30'}
              ios_backgroundColor={colors.border}
              onValueChange={(value) => toggleSwitch(setWaterReminders, value)}
              value={waterReminders}
            />
          </View>
          
          {/* Atualizações de Progresso */}
          <View style={[styles.optionItem, { borderBottomColor: colors.border }]}>
            <View style={styles.optionInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="trending-up-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Atualizações de Progresso</Text>
                <Text style={[styles.optionDescription, { color: colors.text + '80' }]}>
                  Receba atualizações semanais sobre seu progresso
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + '70' }}
              thumbColor={progressUpdates ? colors.primary : colors.text + '30'}
              ios_backgroundColor={colors.border}
              onValueChange={(value) => toggleSwitch(setProgressUpdates, value)}
              value={progressUpdates}
            />
          </View>
          
          {/* Conquistas de Metas */}
          <View style={[styles.optionItem, { borderBottomColor: colors.border }]}>
            <View style={styles.optionInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="trophy-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Conquistas de Metas</Text>
                <Text style={[styles.optionDescription, { color: colors.text + '80' }]}>
                  Receba notificações quando atingir suas metas
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + '70' }}
              thumbColor={goalAchievements ? colors.primary : colors.text + '30'}
              ios_backgroundColor={colors.border}
              onValueChange={(value) => toggleSwitch(setGoalAchievements, value)}
              value={goalAchievements}
            />
          </View>
          
          <ButtonNew
            title="Salvar Configurações"
            onPress={handleSaveSettings}
            variant="primary"
            iconName="save-outline"
            iconPosition="left"
            style={styles.saveButton}
            elevation={2}
            hapticFeedback="notification"
          />
          
          <Text style={[styles.disclaimer, { color: colors.text + '60' }]}>
            As notificações ajudam você a manter-se no caminho certo para atingir seus objetivos de fitness e nutrição.
          </Text>
        </ScrollView>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  disclaimer: {
    fontSize: 14,
    marginTop: 24,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  saveButton: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 16,
  },
}); 