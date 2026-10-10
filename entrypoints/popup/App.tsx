import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const hasOpenedSetup = useRef(false);
  const [openError, setOpenError] = useState(false);
  const setupUrl = browser.runtime.getURL("/setup.html");

  useEffect(() => {
    if (hasOpenedSetup.current) return;
    hasOpenedSetup.current = true;

    void browser.tabs
      .create({ url: setupUrl })
      .then(() => window.close())
      .catch((error: unknown) => {
        console.error("Unable to open the PgQnA setup page.", error);
        setOpenError(true);
      });
  }, [setupUrl]);

  return (
    <main className="popup-message">
      <h1>{openError ? "Couldn’t open setup" : "Opening PgQnA setup…"}</h1>
      {openError ? (
        <p>
          <a href={setupUrl} target="_blank" rel="noreferrer">
            Open the setup page
          </a>
        </p>
      ) : (
        <p>Your setup page will open in a new tab.</p>
      )}
    </main>
  );
}

export default App;
