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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

export default function TermsOfUseScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: 0,
        },
      ]}
      edges={["bottom"]}
    >
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
            backgroundColor: colors.card,
            paddingTop: 12,
          },
        ]}
      >
        <View style={styles.leftPlaceholder} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Terms of Use
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
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.lastUpdated, { color: colors.secondary }]}>
          Last updated: {new Date().toLocaleDateString("en-US")}
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          1. Introduction
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Welcome to FitFolio ("App", "Service"), operated by FitFolio Team
          ("we", "us", "our"). These Terms of Use ("Terms") govern your use of
          our mobile application. Please read them carefully.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          2. Acceptance of Terms
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          By accessing or using the FitFolio app, you agree to be bound by these
          Terms and all applicable laws and regulations. If you do not agree
          with any of these terms, you are prohibited from using or accessing
          this app. The materials contained in this app are protected by
          applicable copyright and trademark law.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          3. Eligibility
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You must be at least 18 years old to use this App. By using the App,
          you represent and warrant that you have the right, authority, and
          capacity to enter into this Agreement and to abide by all of the terms
          and conditions set forth herein.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          4. License to Use the App
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Permission is granted to temporarily download one copy of the FitFolio
          app for personal, non-commercial transitory use only. This is the
          grant of a license, not a transfer of title, and under this license
          you may not:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Modify or copy the materials;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Use the materials for any commercial purpose, or for any public
          display (commercial or non-commercial);
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Attempt to decompile or reverse engineer any software contained in
          the FitFolio app;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Remove any copyright or other proprietary notations from the
          materials; or
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Transfer the materials to another person or "mirror" the materials
          on any other server.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          This license shall automatically terminate if you violate any of these
          restrictions and may be terminated by FitFolio at any time.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          5. User Accounts
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          When you create an account with us, you guarantee that the information
          you provide is accurate, complete, and current at all times.
          Inaccurate, incomplete, or obsolete information may result in the
          immediate termination of your account on the App.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You are responsible for maintaining the confidentiality of your
          account and password, including but not limited to the restriction of
          access to your device and/or account. You agree to accept
          responsibility for any and all activities or actions that occur under
          your account and/or password. You must notify us immediately upon
          becoming aware of any breach of security or unauthorized use of your
          account.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          6. User Content
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Our App may allow you to post, link, store, share and otherwise make
          available certain information, text, graphics, videos, or other
          material ("User Content"). You are responsible for the User Content
          that you post on or through the App, including its legality,
          reliability, and appropriateness. By posting User Content, you grant
          us the right and license to use, modify, publicly perform, publicly
          display, reproduce, and distribute such User Content on and through
          the App.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          7. Prohibited Conduct
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You agree not to use the Service to:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Violate any local, state, national, or international law;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Infringe upon or violate our intellectual property rights or the
          intellectual property rights of others;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Harass, abuse, insult, harm, defame, slander, disparage, intimidate,
          or discriminate based on gender, sexual orientation, religion,
          ethnicity, race, age, national origin, or disability;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Submit false or misleading information;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Upload or transmit viruses or any other type of malicious code.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          8. Intellectual Property Rights
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          The App and its original content (excluding User Content), features,
          and functionality are and will remain the exclusive property of
          FitFolio Team and its licensors. The App is protected by copyright,
          trademark, and other laws of both Brazil and foreign countries. Our
          trademarks and trade dress may not be used in connection with any
          product or service without the prior written consent of FitFolio Team.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          9. Physical Activity Notice
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          The App may include features that promote physical activity. Consider
          the risks involved and consult with your medical professional before
          engaging in any physical activity. FitFolio is not responsible or
          liable for any injuries or damages you may sustain that result from
          your use of, or inability to use, the features of the App. The
          information provided by the App is for informational purposes only and
          is not intended as a substitute for professional medical advice,
          diagnosis, or treatment.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          10. Disclaimers
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          The materials on FitFolio's app are provided on an 'as is' basis.
          FitFolio makes no warranties, expressed or implied, and hereby
          disclaims and negates all other warranties including, without
          limitation, implied warranties or conditions of merchantability,
          fitness for a particular purpose, or non-infringement of intellectual
          property or other violation of rights.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Further, FitFolio does not warrant or make any representations
          concerning the accuracy, likely results, or reliability of the use of
          the materials on its app or otherwise relating to such materials or on
          any sites linked to this app.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          11. Limitation of Liability
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          In no event shall FitFolio or its suppliers be liable for any damages
          (including, without limitation, damages for loss of data or profit, or
          due to business interruption) arising out of the use or inability to
          use the materials on FitFolio's app, even if FitFolio or a FitFolio
          authorized representative has been notified orally or in writing of
          the possibility of such damage. Because some jurisdictions do not
          allow limitations on implied warranties, or limitations of liability
          for consequential or incidental damages, these limitations may not
          apply to you.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          12. Indemnification
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You agree to defend, indemnify and hold harmless FitFolio Team and its
          licensee and licensors, and their employees, contractors, agents,
          officers and directors, from and against any and all claims, damages,
          obligations, losses, liabilities, costs or debt, and expenses
          (including but not limited to attorney's fees), resulting from or
          arising out of a) your use and access of the App, by you or any person
          using your account and password, or b) a breach of these Terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          13. Accuracy of Materials
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          The materials appearing on FitFolio's app could include technical,
          typographical, or photographic errors. FitFolio does not warrant that
          any of the materials on its app are accurate, complete or current.
          FitFolio may make changes to the materials contained on its app at any
          time without notice. However, FitFolio does not make any commitment to
          update the materials.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          14. Links to Other Web Sites
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Our App may contain links to third-party web sites or services that
          are not owned or controlled by FitFolio Team. FitFolio Team has no
          control over, and assumes no responsibility for, the content, privacy
          policies, or practices of any third party web sites or services. You
          further acknowledge and agree that FitFolio Team shall not be
          responsible or liable, directly or indirectly, for any damage or loss
          caused or alleged to be caused by or in connection with use of or
          reliance on any such content, goods or services available on or
          through any such web sites or services. We strongly advise you to read
          the terms and conditions and privacy policies of any third-party web
          sites or services that you visit.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          15. Termination
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may terminate or suspend your account and bar access to the App
          immediately, without prior notice or liability, under our sole
          discretion, for any reason whatsoever and without limitation,
          including but not limited to a breach of the Terms. If you wish to
          terminate your account, you may simply discontinue using the App. All
          provisions of the Terms which by their nature should survive
          termination shall survive termination, including, without limitation,
          ownership provisions, warranty disclaimers, indemnity and limitations
          of liability.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          16. Changes to Terms
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          FitFolio reserves the right, at its sole discretion, to modify or
          replace these Terms at any time. If a revision is material we will
          provide at least 30 days' notice prior to any new terms taking effect.
          What constitutes a material change will be determined at our sole
          discretion. By continuing to access or use our App after any revisions
          become effective, you agree to be bound by the revised terms. If you
          do not agree to the new terms, you are no longer authorized to use the
          App.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          17. Governing Law
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          These Terms shall be governed and construed in accordance with the
          laws of Brazil, without regard to its conflict of law provisions. Our
          failure to enforce any right or provision of these Terms will not be
          considered a waiver of those rights. If any provision of these Terms
          is held to be invalid or unenforceable by a court, the remaining
          provisions of these Terms will remain in effect. These Terms
          constitute the entire agreement between us regarding our App, and
          supersede and replace any prior agreements we might have had between
          us regarding the App.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          18. Dispute Resolution
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Any disputes arising out of or relating to these Terms or the App will
          be resolved through binding arbitration in accordance with the rules
          of a recognized arbitration association in Brazil, rather than in
          court, except that you may assert claims in small claims court if your
          claims qualify.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          19. Contact Information
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          If you have any questions about these Terms, please contact us at
          fitfolio.app.br@gmail.com or visit our website at fitfolio.com.br.
        </Text>

        {/* Extra space at the bottom to allow scrolling further up */}
        <View style={styles.extraSpace} />
      </ScrollView>
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
