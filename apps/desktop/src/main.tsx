import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
function App() {
  return <main className="shell"><p className="eyebrow">GENESIS 0.0.1-ALPHA</p><h1>SideStage</h1><p className="tagline">A workspace for live musicians.</p><section className="status"><span className="dot" />Foundation online</section></main>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
