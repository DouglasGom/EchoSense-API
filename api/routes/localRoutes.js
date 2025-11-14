// routes/locationRoutes.js
const express = require("express");
const { db, admin } = require("../config/firebase-admin");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { locationName } = req.body;
    const userId = req.user.uid; 

    if (!locationName) {
      return res.status(400).send({ message: "O 'locationName' é obrigatório." });
    }

    const newLocationRef = db.collection("locations").doc();
    
    await newLocationRef.set({
      name: locationName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(), 
      userId: userId,
    });

    res.status(201).send({ id: newLocationRef.id, message: "Localização salva." });
  } catch (error) {
    console.error("Erro ao salvar localização:", error);
    res.status(500).send({ message: "Erro interno ao salvar localização." });
  }
});

module.exports = router;