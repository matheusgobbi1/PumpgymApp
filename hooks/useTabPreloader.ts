import { useState, useEffect, useCallback } from "react";
import { InteractionManager } from "react-native";

interface TabPreloaderOptions {
  enabled?: boolean;
  delayMs?: number;
}

/**
 * Hook para precarregar componentes pesados nas tabs
 * Adia a renderização de componentes pesados até que as interações iniciais
 * e animações de transição estejam completas
 */
export function useTabPreloader(options: TabPreloaderOptions = {}) {
  const { enabled = true, delayMs = 100 } = options;
  const [isReady, setIsReady] = useState(!enabled);

  // Registra quais tabs já foram carregadas
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!enabled) return;

    // Usa InteractionManager para adiar a renderização completa até que
    // todas as animações de navegação estejam completas
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      // Adiciona um pequeno delay adicional para garantir que a UI esteja responsiva
      setTimeout(() => {
        setIsReady(true);
      }, delayMs);
    });

    return () => interactionPromise.cancel();
  }, [enabled, delayMs]);

  // Marca uma tab específica como carregada
  const markTabAsLoaded = useCallback((tabName: string) => {
    setLoadedTabs((prev) => ({
      ...prev,
      [tabName]: true,
    }));
  }, []);

  // Verifica se uma tab específica já foi carregada
  const isTabLoaded = useCallback(
    (tabName: string) => {
      return loadedTabs[tabName] === true;
    },
    [loadedTabs]
  );

  // Função para usar no componente para renderização condicional
  const withPreloadDelay = useCallback(
    (tabName: string, renderer: () => JSX.Element, fallback: JSX.Element) => {
      if (!isReady) return fallback;

      // Se a tab já foi carregada, renderiza normalmente
      if (isTabLoaded(tabName)) {
        return renderer();
      }

      // Se é a primeira vez carregando esta tab, marca como carregada e renderiza
      markTabAsLoaded(tabName);
      return renderer();
    },
    [isReady, isTabLoaded, markTabAsLoaded]
  );

  return {
    isReady,
    withPreloadDelay,
    isTabLoaded,
    markTabAsLoaded,
  };
}
