import React, { useEffect } from "react";
import Routes from "./Routes";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "NotificationContext";
import { applyTheme } from "utils/theme";
function App() {
  // The theme follows the logged-in user, so it is resolved from storage rather
  // than held in state: a reload lands on the right palette before first paint
  // of anything below.
  useEffect(() => {
    applyTheme();
  }, []);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <NotificationProvider>
        <Routes />
      </NotificationProvider>
    </>
  );
}

export default App;
