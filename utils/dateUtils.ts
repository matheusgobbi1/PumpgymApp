import { format, isYesterday, isToday } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import i18n from "../i18n";

export function getLocalDate(dateString?: string): Date {
  if (dateString) {
    // Criar uma data no fuso horário local
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Obter o locale baseado no idioma atual do app
export function getDateLocale() {
  return i18n.language.startsWith("pt") ? ptBR : enUS;
}

// Obter formato de data das traduções
export function getDateFormat(
  formatType:
    | "short"
    | "medium"
    | "long"
    | "weekday"
    | "weekdayShort"
    | "time"
    | "dateTime"
) {
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

  const translatedFormat = i18n.t(path, { defaultValue: null });
  return translatedFormat || defaultFormats[formatType] || defaultFormats.short;
}

// Formatar data conforme locale atual
export function formatDate(date: Date | string, formatStr?: string) {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Usar formato baseado no idioma se não for especificado
  if (!formatStr) {
    formatStr = getDateFormat("short");
  }

  try {
    // Definir formato simples para evitar problemas com locale
    return dateObj.toLocaleDateString(
      i18n.language,
      getLocaleDateOptions(formatStr)
    );
  } catch (error) {
    return dateObj.toLocaleDateString();
  }
}

// Formatar data como relativa ("ontem", "hoje", etc.)
export function formatRelativeDate(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return i18n.t("dates.today", "Today");
  } else if (isYesterday(dateObj)) {
    return i18n.t("dates.yesterday", "Yesterday");
  } else {
    return formatDateWithWeekday(dateObj);
  }
}

// Formatação para datas de calendário
export function formatCalendarDate(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDate(dateObj);
}

// Formatação para exibição de data com dia da semana
export function formatDateWithWeekday(date: Date | string) {
  const dateObj = typeof date === "string" ? getLocalDate(date) : date;

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
}

// Formatação para exibição de data longa
export function formatLongDate(date: Date | string) {
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
}

// Verifica se a data é ontem e retorna texto traduzido
export function formatSmartDate(dateString: string) {
  try {
    const date = new Date(dateString);

    if (isToday(date)) {
      return i18n.t("dates.today", "Today");
    } else if (isYesterday(date)) {
      return i18n.t("dates.yesterday", "Yesterday");
    } else {
      return formatDateWithWeekday(date);
    }
  } catch (error) {
    // Se houver erro ao processar a data, retorna uma mensagem padrão
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
}

// Formatar time (horas)
export function formatTime(date: Date) {
  try {
    return date.toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !i18n.language.startsWith("pt"),
    });
  } catch (error) {
    return date.toLocaleTimeString();
  }
}

// Função auxiliar para converter strings de data
export function parseISODate(dateString: string) {
  try {
    return new Date(dateString);
  } catch (error) {
    console.error("Erro ao converter data:", error);
    return new Date(); // Retorna data atual em caso de erro
  }
}

// Função auxiliar para converter formato de date-fns para opções de toLocaleDateString
function getLocaleDateOptions(formatStr: string): Intl.DateTimeFormatOptions {
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
}
