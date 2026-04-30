import express      from "express";
import cookieParser  from "cookie-parser";
import path          from "path";
import { fileURLToPath } from "url";
import router        from "./src/routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", router);

// 404
app.use((req, res) => res.status(404).render("error", { message: "Page not found", user: null }));

// 500
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("error", { message: "Internal server error", user: null });
});

export default app;
