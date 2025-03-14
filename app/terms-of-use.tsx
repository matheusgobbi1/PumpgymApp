import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

export default function TermsOfUseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: colors.card,
          },
        ]}
      >
        <View style={styles.leftPlaceholder} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Termos de Uso
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <Text style={[styles.lastUpdated, { color: colors.secondary }]}>
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          1. Aceitação dos Termos
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Ao acessar ou usar o aplicativo FitFolio, você concorda em cumprir
          estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você
          não concordar com algum destes termos, está proibido de usar ou
          acessar este aplicativo.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          2. Uso da Licença
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          É concedida permissão para baixar temporariamente uma cópia do
          aplicativo FitFolio para uso pessoal e não comercial. Esta é a
          concessão de uma licença, não uma transferência de título, e sob esta
          licença você não pode:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Modificar ou copiar os materiais;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Usar os materiais para qualquer finalidade comercial ou para
          exibição pública;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Tentar descompilar ou fazer engenharia reversa de qualquer software
          contido no aplicativo FitFolio;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Remover quaisquer direitos autorais ou outras notações de
          propriedade dos materiais;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Transferir os materiais para outra pessoa ou "espelhar" os materiais
          em qualquer outro servidor.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          3. Contas de Usuário
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Quando você cria uma conta conosco, você garante que as informações
          que nos fornece são precisas, completas e atualizadas em todos os
          momentos. Informações imprecisas, incompletas ou desatualizadas podem
          resultar no encerramento imediato de sua conta no aplicativo.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Você é responsável por manter a confidencialidade de sua conta e
          senha, incluindo, mas não se limitando a, restrição de acesso ao seu
          computador e/ou conta. Você concorda em aceitar a responsabilidade por
          quaisquer atividades ou ações que ocorram sob sua conta e/ou senha.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          4. Conteúdo do Usuário
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Nosso aplicativo permite que você poste, vincule, armazene,
          compartilhe e disponibilize certas informações, textos, gráficos,
          vídeos ou outros materiais. Você é responsável pelo conteúdo que
          publica no aplicativo, incluindo sua legalidade, confiabilidade e
          adequação.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          5. Limitações
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Em nenhum caso o FitFolio ou seus fornecedores serão responsáveis por
          quaisquer danos (incluindo, sem limitação, danos por perda de dados ou
          lucro, ou devido a interrupção dos negócios) decorrentes do uso ou da
          incapacidade de usar os materiais no aplicativo FitFolio, mesmo que o
          FitFolio ou um representante autorizado do FitFolio tenha sido
          notificado oralmente ou por escrito da possibilidade de tais danos.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          6. Precisão dos Materiais
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Os materiais exibidos no aplicativo FitFolio podem incluir erros
          técnicos, tipográficos ou fotográficos. O FitFolio não garante que
          qualquer material em seu aplicativo seja preciso, completo ou atual. O
          FitFolio pode fazer alterações nos materiais contidos em seu
          aplicativo a qualquer momento, sem aviso prévio.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          7. Links
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          O FitFolio não analisou todos os sites vinculados ao seu aplicativo e
          não é responsável pelo conteúdo de nenhum site vinculado. A inclusão
          de qualquer link não implica endosso por parte do FitFolio do site. O
          uso de qualquer site vinculado é por conta e risco do usuário.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          8. Modificações
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          O FitFolio pode revisar estes termos de serviço do aplicativo a
          qualquer momento, sem aviso prévio. Ao usar este aplicativo, você
          concorda em ficar vinculado à versão atual destes termos de serviço.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          9. Lei Aplicável
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Estes termos e condições são regidos e interpretados de acordo com as
          leis do Brasil e você se submete irrevogavelmente à jurisdição
          exclusiva dos tribunais naquele estado ou localidade.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          10. Contato
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Para entrar em contato conosco sobre qualquer dúvida relacionada a
          estes Termos de Uso, visite nosso site em fitfolio.com.br ou envie um
          e-mail para fitfolio.app.br@gmail.com.
        </Text>

        {/* Espaço extra no final para permitir deslizar mais para cima */}
        <View style={styles.extraSpace} />
      </ScrollView>
    </View>
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  leftPlaceholder: {
    width: 30,
  },
  closeButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  lastUpdated: {
    fontSize: 12,
    marginBottom: 20,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
  extraSpace: {
    height: 100,
  },
});
