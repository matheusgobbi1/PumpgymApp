import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  Animated,
  Platform,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";

interface InputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  maxLength?: number;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  leftIcon?: string | React.ReactNode;
  rightIcon?: string | React.ReactNode;
  iconColor?: string;
  iconSize?: number;
  onIconPress?: () => void;
  onRightIconPress?: () => void;
  onLeftIconPress?: () => void;
  floatingLabel?: boolean;
  inputContainerStyle?: ViewStyle;
  isActive?: boolean;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  onBlur,
  onFocus,
  maxLength,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  icon,
  iconPosition = "left",
  leftIcon,
  rightIcon,
  iconColor,
  iconSize = 24,
  onIconPress,
  onRightIconPress,
  onLeftIconPress,
  floatingLabel = false,
  inputContainerStyle,
  isActive,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    Haptics.selectionAsync();
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
  };

  // Renderizar ícone esquerdo
  const renderLeftIcon = () => {
    if (!leftIcon && !(icon && iconPosition === "left")) return null;

    return (
      <MotiView
        key={`left-icon-${theme}`}
        animate={{ scale: isFocused ? 1.1 : 1, opacity: isFocused ? 1 : 0.7 }}
        transition={{ type: "timing", duration: 200 }}
        style={styles.iconLeft}
      >
        <TouchableOpacity
          key={`left-icon-touch-${theme}`}
          onPress={onLeftIconPress || onIconPress}
          disabled={!onLeftIconPress && !onIconPress}
        >
          {icon && iconPosition === "left" ? (
            icon
          ) : typeof leftIcon === "string" ? (
            <Ionicons
              name={leftIcon as any}
              size={iconSize}
              color={isFocused ? colors.primary : iconColor || colors.text}
            />
          ) : (
            leftIcon
          )}
        </TouchableOpacity>
      </MotiView>
    );
  };

  // Renderizar ícone direito
  const renderRightIcon = () => {
    if (secureTextEntry) {
      return (
        <TouchableOpacity
          key={`password-toggle-${theme}`}
          onPress={togglePasswordVisibility}
          style={styles.iconRight}
        >
          <Ionicons
            name={isPasswordVisible ? "eye-off" : "eye"}
            size={24}
            color={isFocused ? colors.primary : colors.text}
          />
        </TouchableOpacity>
      );
    }

    if (!rightIcon && !(icon && iconPosition === "right")) return null;

    return (
      <MotiView
        key={`right-icon-${theme}`}
        animate={{ scale: isFocused ? 1.1 : 1, opacity: isFocused ? 1 : 0.7 }}
        transition={{ type: "timing", duration: 200 }}
        style={styles.iconRight}
      >
        <TouchableOpacity
          key={`right-icon-touch-${theme}`}
          onPress={onRightIconPress || onIconPress}
          disabled={!onRightIconPress && !onIconPress}
        >
          {icon && iconPosition === "right" ? (
            icon
          ) : typeof rightIcon === "string" ? (
            <Ionicons
              name={rightIcon as any}
              size={iconSize}
              color={isFocused ? colors.primary : iconColor || colors.text}
            />
          ) : (
            rightIcon
          )}
        </TouchableOpacity>
      </MotiView>
    );
  };

  // Verificar se há ícones
  const hasLeftIcon = leftIcon || (icon && iconPosition === "left");
  const hasRightIcon =
    rightIcon || secureTextEntry || (icon && iconPosition === "right");

  return (
    <View key={`input-container-${label || placeholder}-${theme}`} style={[styles.container, containerStyle]}>
      {label && (
        <MotiView
          key={`label-container-${theme}`}
          animate={{ translateX: isFocused ? 5 : 0 }}
          transition={{ type: "timing", duration: 200 }}
        >
          <Text
            key={`label-text-${theme}`}
            style={[
              styles.label,
              {
                color: isFocused ? colors.primary : colors.text,
                fontWeight: isFocused ? "600" : "500",
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        </MotiView>
      )}
      <MotiView
        key={`input-field-container-${theme}`}
        animate={{
          borderColor: error
            ? colors.danger
            : isFocused || isActive
            ? colors.primary
            : colors.border,
          borderWidth: isFocused ? 2 : 1,
          backgroundColor: theme === "dark" ? "#2A2A2A" : "#F8F9FA",
        }}
        transition={{ type: "timing", duration: 200 }}
        style={[styles.inputContainer, inputContainerStyle]}
      >
        {renderLeftIcon()}

        <TextInput
          key={`text-input-${theme}`}
          style={[
            styles.input,
            {
              color: colors.text,
              paddingLeft: hasLeftIcon ? 8 : 16,
              paddingRight: hasRightIcon ? 8 : 16,
            },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme === "dark" ? "#666666" : "#A0A0A0"}
          value={value}
          onChangeText={handleChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />

        {renderRightIcon()}
      </MotiView>
      {error && (
        <MotiView
          key={`error-container-${theme}`}
          from={{ opacity: 0, translateY: -5 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring" }}
        >
          <Text key={`error-text-${theme}`} style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        </MotiView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    height: 60,
    position: "relative",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  iconLeft: {
    paddingLeft: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconRight: {
    paddingRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
});
