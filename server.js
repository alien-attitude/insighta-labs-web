import "./src/config.js";  // loads env first
import app from "./app.js";
import { PORT } from "./src/config.js";

app.listen(PORT, () => {
  console.log(`Insighta Web Portal running at http://localhost:${PORT}`);
});
