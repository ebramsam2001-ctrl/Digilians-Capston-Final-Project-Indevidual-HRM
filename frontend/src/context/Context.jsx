// TodoContext.jsx
import { createContext, useState, useContext } from "react";

const generalContext = createContext();

export function GeneralContextProvider({ children }) {
  const [userdata, setUserData] = useState({});

  return (
    <generalContext.Provider value={{ userdata, setUserData }}>
      {children}
    </generalContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useGeneralContext() {
  const context = useContext(generalContext);
  if (!context) {
    throw new Error("error 15");
  }
  return context;
};