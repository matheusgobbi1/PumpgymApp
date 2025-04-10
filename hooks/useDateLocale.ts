import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { isYesterday, isToday } from "date-fns";

/**
 * Hook para facilitar o uso de formatação de datas com suporte a idiomas
 */
export function useDateLocale() {
  const { t, i18n } = useTranslation();

  // Obter formato de data das traduções
  const getDateFormat = useCallback(
    (
      formatType:
        | "short"
        | "medium"
        | "long"
        | "weekday"
        | "weekdayShort"
        | "time"
        | "dateTime"
    ) => {
      // Tentar pegar o formato das traduções
      const path = `dates.formats.${formatType}`;
      const defaultFormats = {
        short: i18n.language.startsWith("pt") ? "dd/MM/yyyy" : "MM/dd/yyyy",
        medium: i18n.language.startsWith("pt")
          ? "dd 'de' MMM, yyyy"
          : "MMM dd, yyyy",
        long: i18n.language.startsWith("pt")
          ? "dd 'de' MMMM 'de' yyyy"
          : "MMMM dd, yyyy",
        weekday: i18n.language.startsWith("pt")
          ? "EEEE, dd 'de' MMMM"
          : "EEEE, MMMM dd",
        weekdayShort: i18n.language.startsWith("pt")
          ? "EEEE, dd/MM"
          : "EEEE, MM/dd",
        time: i18n.language.startsWith("pt") ? "HH:mm" : "h:mm a",
        dateTime: i18n.language.startsWith("pt")
          ? "dd/MM/yyyy HH:mm"
          : "MM/dd/yyyy h:mm a",
      };

      const translatedFormat = t(path, { defaultValue: null });
      return (
        translatedFormat || defaultFormats[formatType] || defaultFormats.short
      );
    },
    [t, i18n.language]
  );

  // Função auxiliar para converter formato para opções de toLocaleDateString
  const getLocaleDateOptions = useCallback(
    (formatStr: string): Intl.DateTimeFormatOptions => {
      const options: Intl.DateTimeFormatOptions = {};

      if (formatStr.includes("yyyy")) options.year = "numeric";
      if (formatStr.includes("MM")) options.month = "2-digit";
      if (formatStr.includes("MMM") && !formatStr.includes("MMMM"))
        options.month = "short";
      if (formatStr.includes("MMMM")) options.month = "long";
      if (formatStr.includes("dd")) options.day = "2-digit";
      if (formatStr.includes("EEEE")) options.weekday = "long";
      if (formatStr.includes("EEE") && !formatStr.includes("EEEE"))
        options.weekday = "short";
      if (formatStr.includes("HH") || formatStr.includes("h")) {
        options.hour = "2-digit";
        options.minute = "2-digit";
        options.hour12 = formatStr.includes("a");
      }

      return options;
    },
    []
  );

  // Formatar data conforme locale atual
  const formatDate = useCallback(
    (date: Date | string, formatStr?: string) => {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      // Usar formato baseado no idioma se não for especificado
      if (!formatStr) {
        formatStr = getDateFormat("short");
      }

      try {
        // Usar API nativa para formatação de data
        return dateObj.toLocaleDateString(
          i18n.language,
          getLocaleDateOptions(formatStr)
        );
      } catch (error) {
        return dateObj.toLocaleDateString();
      }
    },
    [i18n.language, getDateFormat, getLocaleDateOptions]
  );

  // Formatação para exibição de data com dia da semana
  const formatDateWithWeekday = useCallback(
    (date: Date | string) => {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      try {
        if (i18n.language.startsWith("pt")) {
          // Para português, use formato "8 de abril"
          return dateObj.toLocaleDateString(i18n.language, {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
        } else {
          // Para outros idiomas, manter o padrão existente
          return dateObj.toLocaleDateString(i18n.language, {
            weekday: "long",
            day: "numeric",
            month: "short",
          });
        }
      } catch (error) {
        return dateObj.toLocaleDateString();
      }
    },
    [i18n.language]
  );

  // Formatação para exibição de data longa
  const formatLongDate = useCallback(
    (date: Date | string) => {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      try {
        return dateObj.toLocaleDateString(i18n.language, {
          day: "numeric",
          month: "long",
          year: "numeric",
          weekday: "long",
        });
      } catch (error) {
        return dateObj.toLocaleDateString();
      }
    },
    [i18n.language]
  );

  // Formatar data como "ontem", "hoje", etc.
  const formatSmartDate = useCallback(
    (dateString: string | Date) => {
      try {
        const date =
          typeof dateString === "string" ? new Date(dateString) : dateString;

        if (isToday(date)) {
          return t("dates.today", "Today");
        } else if (isYesterday(date)) {
          return t("dates.yesterday", "Yesterday");
        } else {
          return formatDateWithWeekday(date);
        }
      } catch (error) {
        console.error("Erro ao formatar data:", error);
        return "Data inválida";
      }
    },
    [t, formatDateWithWeekday]
  );

  // Formatar time (horas)
  const formatTime = useCallback(
    (date: Date) => {
      try {
        return date.toLocaleTimeString(i18n.language, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: !i18n.language.startsWith("pt"),
        });
      } catch (error) {
        return date.toLocaleTimeString();
      }
    },
    [i18n.language]
  );

  // Função auxiliar para converter string em Date
  const parseDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString);
    } catch (error) {
      console.error("Erro ao converter data:", error);
      return new Date(); // Retorna data atual em caso de erro
    }
  }, []);

  return {
    formatDate,
    formatDateWithWeekday,
    formatLongDate,
    formatSmartDate,
    formatTime,
    parseDate,
    getDateFormat,
  };
}
