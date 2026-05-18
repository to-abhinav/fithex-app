import React, { createContext, useContext, useState, useCallback } from 'react';
import { getGymRequests } from '../api/ownerService';

const PendingRequestContext = createContext({ count: 0, refresh: () => {}, setCount: () => {} });

export const PendingRequestProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await getGymRequests("Pending");
      const c = data?.total ?? data?.requests?.length ?? 0;
      setCount(c);
      return c;
    } catch {
      return 0;
    }
  }, []);

  return (
    <PendingRequestContext.Provider value={{ count, refresh, setCount }}>
      {children}
    </PendingRequestContext.Provider>
  );
};

export const usePendingRequests = () => useContext(PendingRequestContext);
