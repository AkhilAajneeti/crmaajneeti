import React from "react";
import Routes from "./Routes";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "NotificationContext";
import TricolorTheme from "components/ui/TricolorTheme";
function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      {/* Independence Day tricolor overlay — covers every route. Remove this
          single line to turn the theme off everywhere. */}
      <TricolorTheme />
      <NotificationProvider>
        <Routes />
      </NotificationProvider>
    </>
  );
}

export default App;
