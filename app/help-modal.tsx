import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import Colors from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import ButtonNew from "../components/common/ButtonNew";

// Interface para os itens de FAQ
interface FAQItem {
  question: string;
  answer: string;
  isExpanded: boolean;
}

export default function HelpModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  // Estado para o formulário de contato
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Controle de animação
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const animationExecuted = useRef(false);

  useEffect(() => {
    if (!animationExecuted.current) {
      setShouldAnimate(true);
      animationExecuted.current = true;
    } else {
      setShouldAnimate(false);
    }
  }, []);

  // Estado para os itens de FAQ
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    {
      question: "Como adicionar um novo treino?",
      answer:
        'Para adicionar um novo treino, vá para a aba "Treino" e toque no botão "+" no canto inferior direito. Em seguida, selecione o tipo de treino e adicione os exercícios desejados.',
      isExpanded: false,
    },
    {
      question: "Como registrar uma refeição?",
      answer:
        'Para registrar uma refeição, vá para a aba "Nutrição" e toque no botão "+" no canto inferior direito. Selecione o tipo de refeição e adicione os alimentos consumidos.',
      isExpanded: false,
    },
    {
      question: "Como alterar minhas metas de nutrição?",
      answer:
        'Para alterar suas metas de nutrição, vá para a aba "Perfil" e toque em "Configurações". Em seguida, selecione "Metas de Nutrição" e ajuste os valores conforme desejado.',
      isExpanded: false,
    },
    {
      question: "Como visualizar meu progresso?",
      answer:
        'Para visualizar seu progresso, vá para a aba "Início" e deslize para baixo para ver os gráficos de progresso. Você também pode tocar em um gráfico específico para ver mais detalhes.',
      isExpanded: false,
    },
    {
      question: "Como exportar meus dados?",
      answer:
        'Para exportar seus dados, vá para a aba "Perfil", toque em "Configurações" e selecione "Exportar Dados". Escolha o formato desejado e o período de tempo para exportar.',
      isExpanded: false,
    },
  ]);

  // Função para voltar
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Função para expandir/recolher um item de FAQ
  const toggleFAQItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedFAQItems = [...faqItems];
    updatedFAQItems[index].isExpanded = !updatedFAQItems[index].isExpanded;
    setFaqItems(updatedFAQItems);
  };

  // Função para enviar mensagem de suporte
  const handleSendMessage = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(
        "Campos obrigatórios",
        "Por favor, preencha todos os campos."
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Aqui você implementaria a lógica para enviar a mensagem
    // Por enquanto, vamos apenas simular o envio
    Alert.alert(
      "Mensagem Enviada",
      "Sua mensagem foi enviada com sucesso. Nossa equipe entrará em contato em breve.",
      [
        {
          text: "OK",
          onPress: () => {
            setSubject("");
            setMessage("");
          },
        },
      ]
    );
  };

  // Função para abrir o email de suporte
  const handleEmailSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(
      "mailto:fitfolio.app.br@gmail.com?subject=Suporte Fitfolio"
    );
  };

  // Função para abrir o chat de suporte
  const handleLiveChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Aqui você implementaria a lógica para abrir o chat de suporte
    Alert.alert(
      "Chat de Suporte",
      "O chat de suporte estará disponível em breve."
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <MotiView
        from={
          shouldAnimate
            ? { opacity: 0, translateY: 10 }
            : { opacity: 1, translateY: 0 }
        }
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", delay: 100 }}
        style={styles.container}
      >
        {/* Cabeçalho */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Ajuda e Suporte
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Conteúdo */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Opções de Suporte */}
          <View style={styles.supportOptionsContainer}>
            <ButtonNew
              title="Email"
              onPress={handleEmailSupport}
              variant="outline"
              iconName="mail-outline"
              style={{ width: 160 }}
              fullWidth={false}
              size="small"
            />
          </View>

          {/* FAQ */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Perguntas Frequentes
          </Text>

          {faqItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.faqItem, { borderBottomColor: colors.border }]}
              onPress={() => toggleFAQItem(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  {item.question}
                </Text>
                <Ionicons
                  name={item.isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text + "70"}
                />
              </View>

              {item.isExpanded && (
                <MotiView
                  from={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ type: "timing", duration: 300 }}
                  style={styles.faqAnswerContainer}
                >
                  <Text
                    style={[styles.faqAnswer, { color: colors.text + "80" }]}
                  >
                    {item.answer}
                  </Text>
                </MotiView>
              )}
            </TouchableOpacity>
          ))}

          {/* Formulário de Contato */}
          <Text
            style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}
          >
            Entre em Contato
          </Text>

          <View style={styles.formContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Assunto
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.light,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Digite o assunto"
              placeholderTextColor={colors.text + "50"}
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Mensagem
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.light,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Digite sua mensagem"
              placeholderTextColor={colors.text + "50"}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />

            <ButtonNew
              title="Enviar Mensagem"
              onPress={handleSendMessage}
              variant="primary"
              iconName="send-outline"
              iconPosition="right"
              size="medium"
              elevation={2}
            />
          </View>

          <Text style={[styles.disclaimer, { color: colors.text + "60" }]}>
            Nossa equipe de suporte está disponível de segunda a sexta, das 9h
            às 18h. Faremos o possível para responder sua mensagem em até 24
            horas.
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  supportOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    paddingRight: 16,
  },
  faqAnswerContainer: {
    marginTop: 12,
    overflow: "hidden",
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  disclaimer: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
});
