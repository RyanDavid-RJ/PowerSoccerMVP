require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const atletaRoutes = require("./routes/atletaRoutes");
const partidaRoutes = require("./routes/partidaRoutes");
const eventoRoutes = require("./routes/eventoRoutes");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/status", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ mensagem: "PowerSoccer API v2 operando 100% 🚀" });
  } catch (error) {
    res.status(500).json({ erro: "Falha na comunicação com o Aiven" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/atletas", atletaRoutes);
app.use("/api/partidas", partidaRoutes);
app.use("/api/eventos", eventoRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
