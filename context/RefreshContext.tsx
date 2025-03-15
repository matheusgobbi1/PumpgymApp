import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
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
      console.log("Refresh ignorado - muito rápido após o último");
      return;
    }

    // Atualizar o timestamp do último refresh
    setLastRefreshTime(now);

    // Evitar atualização se já estiver atualizando
    if (!isRefreshing) {
      setIsRefreshing(true);
      // Usar setTimeout para garantir que o estado isRefreshing seja atualizado antes
      setTimeout(() => {
        setRefreshKey((prev) => prev + 1);
        // Resetar o estado de atualização após um pequeno delay
        setTimeout(() => {
          setIsRefreshing(false);
        }, 100);
      }, 0);
    }
  }, [isRefreshing, lastRefreshTime]);

  return (
    <RefreshContext.Provider
      value={{ refreshKey, triggerRefresh, isRefreshing }}
    >
      {children}
    </RefreshContext.Provider>
  );
};
