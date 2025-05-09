import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

export default function PrivacyPolicyScreen() {
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
          Privacy Policy
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

        <Text style={[styles.paragraph, { color: colors.text }]}>
          FitFolio ("we", "us", or "our") is committed to protecting your
          privacy. This Privacy Policy explains how your personal information is
          collected, used, and disclosed by FitFolio.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          This Privacy Policy applies to the information we collect when you use
          our FitFolio mobile application (collectively, the "Services").
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          By accessing or using our Services, you signify that you have read,
          understood, and agree to our collection, storage, use, and disclosure
          of your personal information as described in this Privacy Policy and
          our Terms of Use.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          1. Information We Collect
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may collect and process the following types of personal information
          about you:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            Information You Provide to Us:
          </Text>{" "}
          We collect information you provide directly to us, such as when you
          create an account, fill out a form, submit a customer support request,
          or otherwise communicate with us. The types of information we may
          collect include your name, email address, profile information (such as
          age, height, weight, gender), fitness goals, and any other information
          you choose to provide.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            Information We Collect Automatically When You Use the Services:
          </Text>{" "}
          We collect information about how you use our Services, including the
          types of content you view or engage with, the features you use, the
          actions you take, and the time, frequency, and duration of your
          activities. This includes information about the workouts you log,
          meals, physical progress, and other health and fitness-related
          metrics.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • <Text style={{ fontWeight: "600" }}>Device Information:</Text> We
          collect information about the device you use to access our Services,
          including the hardware model, operating system and version, unique
          device identifiers, network information, and IP address.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • <Text style={{ fontWeight: "600" }}>Location Information:</Text>{" "}
          With your permission, we may collect and process information about
          your precise or approximate location. We use various technologies to
          determine location, including IP address, GPS, and other sensors.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            Information from Third Parties:
          </Text>{" "}
          We may receive information about you from third-party services, such
          as social media platforms if you choose to log in or connect your
          account, or from health and fitness platforms like Apple HealthKit or
          Google Fit if you grant us permission to access that data. This
          information will be treated in accordance with this Privacy Policy.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          2. How We Use Your Information
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We use the information we collect to:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Provide, maintain, and improve our Services;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Process and complete transactions, and send you related information,
          including purchase confirmations and invoices;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Send you technical notices, updates, security alerts, and support
          and administrative messages;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Respond to your comments, questions, and requests, and provide
          customer service;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Communicate with you about products, services, offers, promotions,
          rewards, and events offered by us and others, and provide news and
          information we think will be of interest to you;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Monitor and analyze trends, usage, and activities in connection with
          our Services;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Personalize and improve the Services and provide content, features,
          and/or advertisements tailored to your interests and preferences;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Process and deliver contest entries and rewards;
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • Detect, investigate, and prevent fraudulent transactions and other
          illegal activities and protect the rights and property of FitFolio and
          others.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          3. How We Share Your Information
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may share the personal information we collect as follows:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            With Vendors, Consultants, and Other Service Providers:
          </Text>{" "}
          We may share your information with vendors, consultants, and other
          service providers who need access to such information to carry out
          work on our behalf. These service providers are authorized to use your
          personal information only as necessary to provide these services to us
          and are obligated to protect your information.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            In Response to a Legal Process:
          </Text>{" "}
          We may disclose your information if we believe disclosure is in
          accordance with, or required by, any applicable law, regulation, or
          legal process.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            To Protect Rights, Property, and Others:
          </Text>{" "}
          We may disclose your information if we believe your actions are
          inconsistent with our user agreements or policies, or to protect the
          rights, property, and safety of FitFolio or others.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • <Text style={{ fontWeight: "600" }}>With Your Consent:</Text> We may
          share your information when we have your consent to do so, including
          if we notify you through our Services that the information you provide
          will be shared in a particular manner and you provide such
          information.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • <Text style={{ fontWeight: "600" }}>Business Transfers:</Text> We
          may share or transfer your information in connection with, or during
          negotiations of, any merger, sale of company assets, financing, or
          acquisition of all or a portion of our business to another company.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text, marginTop: 16 }]}>
          We do not sell your personal information to third parties.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          4. Data Retention
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We store the information we collect about you for as long as is
          necessary for the purpose(s) for which we originally collected it, or
          for other legitimate business purposes, including to meet our legal,
          regulatory, or other compliance obligations. If you wish to delete
          your account or request that we no longer use your information to
          provide you Services, contact us at the email provided below.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          5. Data Security
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          FitFolio takes reasonable measures to help protect personal
          information from loss, theft, misuse, and unauthorized access,
          disclosure, alteration, and destruction. However, no Internet or email
          transmission is ever fully secure or error-free. Therefore, you should
          take special care in deciding what information you send to us via the
          Services or email. Please keep this in mind when disclosing any
          personal information to FitFolio via the Internet.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          6. Your Rights and Choices
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You have certain rights and choices regarding your personal
          information:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • <Text style={{ fontWeight: "600" }}>Account Information:</Text> You
          may update, correct, or delete certain account information at any time
          by logging into your account settings within the app.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>Promotional Communications:</Text>{" "}
          You may opt out of receiving promotional emails from us by following
          the instructions in those emails. If you opt out, we may still send
          you non-promotional emails, such as those about your account or our
          ongoing business relations.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          • <Text style={{ fontWeight: "600" }}>Location Information:</Text> You
          can control how we collect and use location information through your
          device settings.
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.text }]}>
          •{" "}
          <Text style={{ fontWeight: "600" }}>
            Access, Correction, and Deletion:
          </Text>{" "}
          Depending on your jurisdiction, you may have the right to request
          access to, correction of, or deletion of your personal information.
          You can submit these requests by contacting us at the email address
          below.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          7. Children's Privacy
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Our Services are not directed to individuals under the age of 13 (or a
          higher age threshold where applicable under local law). We do not
          knowingly collect personal information from children under 13. If we
          become aware that a child under 13 has provided us with personal
          information, we will take steps to delete such information. If you
          become aware that a child has provided us with personal information,
          please contact us at the contact information provided below.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          8. International Data Transfers
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Your information, including personal data, may be transferred to — and
          maintained on — computers located outside of your state, province,
          country, or other governmental jurisdiction where the data protection
          laws may differ from those in your jurisdiction. If you are located
          outside Brazil and choose to provide information to us, please note
          that we transfer the data, including personal data, to Brazil and
          process it there. Your consent to this Privacy Policy followed by your
          submission of such information represents your agreement to that
          transfer.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          9. Changes to This Privacy Policy
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may change this Privacy Policy from time to time. If we make
          changes, we will notify you by revising the date at the top of the
          policy and, in some cases, we may provide you with additional notice
          (such as adding a statement to our homepage or sending you an email
          notification). We encourage you to review the Privacy Policy whenever
          you access the Services to stay informed about our information
          practices and the ways you can help protect your privacy.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          10. Contact Us
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          If you have any questions about this Privacy Policy, please contact us
          at fitfolio.app.br@gmail.com or visit our website at fitfolio.com.br.
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
