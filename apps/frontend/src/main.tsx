// The site serif (--font-serif), self-hosted. Browsers only download it on
// pages that use it.
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/newsreader/wght.css";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./instrumentation";
import { IS_UAT } from "./lib/environment";
import "./main.scss";

if (IS_UAT) document.title = `[UAT] ${document.title}`;

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
