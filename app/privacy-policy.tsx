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

export default function PrivacyPolicyScreen() {
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
          Política de Privacidade
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

        <Text style={[styles.paragraph, { color: colors.text }]}>
          A FitFolio ("nós", "nosso" ou "nossos") está comprometida em proteger
          sua privacidade. Esta Política de Privacidade explica como suas
          informações pessoais são coletadas, usadas e divulgadas pelo FitFolio.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Esta Política de Privacidade se aplica às informações que coletamos
          quando você usa nosso aplicativo móvel FitFolio (coletivamente, os
          "Serviços").
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Ao acessar ou usar nossos Serviços, você indica que leu, entendeu e
          concorda com nossa coleta, armazenamento, uso e divulgação de suas
          informações pessoais conforme descrito nesta Política de Privacidade.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          1. Informações que Coletamos
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Podemos coletar e processar os seguintes tipos de informações pessoais
          sobre você:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            Informações que você nos fornece:
          </Text>{" "}
          Coletamos informações que você nos fornece diretamente, como quando
          cria uma conta, preenche um formulário, envia uma solicitação de
          suporte ao cliente, ou se comunica conosco de qualquer forma. Os tipos
          de informações que podemos coletar incluem seu nome, endereço de
          e-mail, senha, informações de perfil (como idade, altura, peso,
          gênero), objetivos de condicionamento físico, e qualquer outra
          informação que você optar por fornecer.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • <Text style={{ fontWeight: "600" }}>Informações de uso:</Text>{" "}
          Coletamos informações sobre como você usa nossos Serviços, incluindo
          os tipos de conteúdo que você visualiza ou com os quais se envolve, os
          recursos que você usa, as ações que você realiza, o tempo, frequência
          e duração de suas atividades. Isso inclui informações sobre os treinos
          que você registra, refeições, progresso físico e outras métricas
          relacionadas à saúde e fitness.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>Informações do dispositivo:</Text>{" "}
          Coletamos informações sobre o dispositivo que você usa para acessar
          nossos Serviços, incluindo modelo de hardware, sistema operacional e
          versão, identificadores de dispositivo únicos, informações de rede e
          endereço IP.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>Informações de localização:</Text>{" "}
          Com sua permissão, podemos coletar e processar informações sobre sua
          localização precisa ou aproximada. Usamos várias tecnologias para
          determinar a localização, incluindo endereço IP, GPS e outros
          sensores.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          2. Como Usamos Suas Informações
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Usamos as informações que coletamos para:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Fornecer, manter e melhorar nossos Serviços;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Processar e completar transações, e enviar informações relacionadas,
          incluindo confirmações de compra e faturas;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Enviar mensagens técnicas, atualizações, alertas de segurança e
          mensagens de suporte e administrativas;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Responder a seus comentários, perguntas e solicitações, e fornecer
          atendimento ao cliente;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Comunicar-se com você sobre produtos, serviços, ofertas, promoções,
          recompensas e eventos oferecidos por nós e outros, e fornecer notícias
          e informações que acreditamos ser de seu interesse;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Monitorar e analisar tendências, uso e atividades em conexão com
          nossos Serviços;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Personalizar e melhorar os Serviços e fornecer conteúdo, recursos
          e/ou anúncios adaptados aos seus interesses e preferências;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Processar e entregar participações em concursos e sorteios;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Detectar, investigar e prevenir atividades fraudulentas e outras
          atividades ilegais e proteger os direitos e a propriedade da FitFolio
          e de outros.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          3. Compartilhamento de Informações
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Podemos compartilhar as informações pessoais que coletamos com:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            Fornecedores, consultores e outros provedores de serviços:
          </Text>{" "}
          Podemos compartilhar suas informações com fornecedores, consultores e
          outros provedores de serviços que precisam acessar essas informações
          para realizar trabalhos em nosso nome. Esses provedores de serviços só
          podem acessar, processar e armazenar suas informações pessoais
          enquanto prestam serviços a nós e de acordo com nossas instruções.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            Em resposta a um processo legal:
          </Text>{" "}
          Podemos divulgar suas informações quando acreditarmos de boa fé que a
          divulgação é necessária para cumprir a lei, proteger nossos direitos
          ou os direitos de outros, ou em resposta a um processo legal.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • <Text style={{ fontWeight: "600" }}>Com seu consentimento:</Text>{" "}
          Podemos compartilhar suas informações quando tivermos seu
          consentimento para fazê-lo.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          4. Segurança
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          A FitFolio toma medidas razoáveis para ajudar a proteger as
          informações pessoais contra perda, roubo, uso indevido e acesso não
          autorizado, divulgação, alteração e destruição. No entanto, nenhuma
          transmissão pela Internet ou armazenamento eletrônico de informações
          pode ser garantida como 100% segura.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          5. Seus Direitos e Escolhas
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Você tem certos direitos e escolhas em relação às suas informações
          pessoais:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • <Text style={{ fontWeight: "600" }}>Informações da conta:</Text>{" "}
          Você pode atualizar, corrigir ou excluir certas informações da conta a
          qualquer momento acessando as configurações da sua conta no
          aplicativo.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>Comunicações promocionais:</Text>{" "}
          Você pode optar por não receber e-mails promocionais seguindo as
          instruções nesses e-mails. Se você optar por não receber e-mails
          promocionais, ainda poderemos enviar e-mails não promocionais, como
          e-mails sobre sua conta ou nosso relacionamento comercial contínuo.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>Informações de localização:</Text>{" "}
          Você pode controlar como coletamos e usamos informações de localização
          através das configurações do seu dispositivo.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          6. Alterações nesta Política de Privacidade
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Podemos alterar esta Política de Privacidade de tempos em tempos. Se
          fizermos alterações, notificaremos você revisando a data no topo da
          política e, em alguns casos, podemos fornecer notificação adicional
          (como adicionar uma declaração à nossa página inicial ou enviar uma
          notificação por e-mail).
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          7. Contato
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Se você tiver alguma dúvida sobre esta Política de Privacidade, entre
          em contato conosco em fitfolio.app.br@gmail.com ou visite nosso site
          em fitfolio.com.br.
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
