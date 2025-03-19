import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

interface RefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
};

export const RefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // Usar useCallback para evitar recriações desnecessárias da função
  const triggerRefresh = useCallback(() => {
    const now = Date.now();
    // Evitar múltiplos refreshes em um curto período de tempo (300ms)
    if (now - lastRefreshTime < 300) {
      return;
    }

    // Atualizar o timestamp do último refresh
    setLastRefreshTime(now);

    // Evitar atualização se já estiver atualizando
    if (!isRefreshing) {
      setIsRefreshing(true);
      // Incrementar a chave de refresh imediatamente para melhor performance
      setRefreshKey((prev) => prev + 1);

      // Resetar o estado de isRefreshing após um breve período
      setTimeout(() => {
        setIsRefreshing(false);
      }, 100);
    }
  }, [isRefreshing, lastRefreshTime]);

  // Memoizar o valor do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo(
    () => ({
      refreshKey,
      triggerRefresh,
      isRefreshing,
    }),
    [refreshKey, triggerRefresh, isRefreshing]
  );

  return (
    <RefreshContext.Provider value={contextValue}>
      {children}
    </RefreshContext.Provider>
  );
};
