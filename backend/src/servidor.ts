import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import rutasMuestras from "./rutas/muestras.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET"],
  })
);

app.use(express.json({ limit: "100kb" }));

const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limitador);

app.use("/api", rutasMuestras);

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
