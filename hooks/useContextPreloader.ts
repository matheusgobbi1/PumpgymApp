import { useState, useEffect, useCallback } from "react";
import { InteractionManager } from "react-native";

type PreloadPriority = "high" | "medium" | "low";

interface ContextPreloadOptions {
  priority?: PreloadPriority;
  onPreloadStart?: () => void;
  onPreloadComplete?: () => void;
}

/**
 * Hook para otimizar o carregamento de dados de contexto com prioridades
 *
 * - high: Carrega imediatamente, bloqueando a thread principal (apenas para dados críticos)
 * - medium: Carrega após as interações iniciais serem concluídas, mas antes de renderizar
 * - low: Carrega em background após a renderização inicial
 */
export function useContextPreloader(options: ContextPreloadOptions = {}) {
  const { priority = "medium", onPreloadStart, onPreloadComplete } = options;

  const [status, setStatus] = useState<"idle" | "loading" | "complete">("idle");

  // Função para iniciar o pré-carregamento
  const preload = useCallback(
    async (preloadFunction: () => Promise<any>) => {
      if (status !== "idle") return;

      try {
        setStatus("loading");
        onPreloadStart?.();

        switch (priority) {
          case "high":
            // Executar imediatamente e bloquear
            await preloadFunction();
            break;

          case "medium":
            // Executar após animações
            await new Promise<void>((resolve) => {
              InteractionManager.runAfterInteractions(async () => {
                await preloadFunction();
                resolve();
              });
            });
            break;

          case "low":
            // Executar em background com atraso
            await new Promise<void>((resolve) => {
              setTimeout(async () => {
                await preloadFunction();
                resolve();
              }, 500); // Delay baixa prioridade
            });
            break;
        }

        setStatus("complete");
        onPreloadComplete?.();
      } catch (error) {
        console.error("Erro no preloading de contexto:", error);
        setStatus("idle");
      }
    },
    [priority, status, onPreloadStart, onPreloadComplete]
  );

  // Resetar o estado para permitir novo carregamento
  const reset = useCallback(() => {
    setStatus("idle");
  }, []);

  return {
    preload,
    status,
    reset,
    isLoading: status === "loading",
    isComplete: status === "complete",
  };
}
