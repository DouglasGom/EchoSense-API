const express = require("express");
const cors = require("cors");

const locationRoutes = require("./routes/localRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json()); 

app.use("/api/locations", locationRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("API da Bengala Inteligente está online!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});