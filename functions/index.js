const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors");

admin.initializeApp();

const corsHandler = cors({ origin: true });

/**
 * CREATE PAYPHONE PAYMENT
 * (GEN 1 – ESTABLE)
 */
exports.createPayphonePayment = functions
  .region("us-central1")
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {
        // 🔒 SOLO POST
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { rifaId, numeros, nombre, telefono, monto } = req.body;

        // 🔒 VALIDACIONES
        if (
          !rifaId ||
          !Array.isArray(numeros) ||
          numeros.length === 0 ||
          typeof nombre !== "string" ||
          typeof telefono !== "string" ||
          typeof monto !== "number"
        ) {
          return res.status(400).json({
            error: "Datos inválidos o incompletos",
            body: req.body,
          });
        }

        // 🔑 TOKEN DESDE .env
        const PAYPHONE_TOKEN = process.env.PAYPHONE_TOKEN;
        if (!PAYPHONE_TOKEN) {
          return res.status(500).json({
            error: "PAYPHONE_TOKEN no configurado",
          });
        }

        // 💰 MONTO EN CENTAVOS
        const amountCents = Math.round(monto * 100);

        // 📦 PAYLOAD PAYPHONE (BOTÓN DE PAGO)
        const payload = {
          amount: amountCents,
          amountWithoutTax: amountCents,
          currency: "USD",
          clientTransactionId: `${rifaId}-${Date.now()}`,
          responseUrl: "https://predicaconpoder-v4.vercel.app/gracias",
          cancellationUrl: "https://predicaconpoder-v4.vercel.app/cancelado",
        };

        console.log("➡️ PayPhone payload:", payload);

        const response = await axios.post(
          "https://pay.payphonetodoesposible.com/api/button/Prepare",
          payload,
          {
            headers: {
              Authorization: `Bearer ${PAYPHONE_TOKEN}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );

        console.log("⬅️ PayPhone response:", response.data);

        if (!response.data || !response.data.paymentUrl) {
          return res.status(500).json({
            error: "PayPhone no devolvió paymentUrl",
            response: response.data,
          });
        }

        // ✅ RESPUESTA AL FRONTEND
        return res.status(200).json({
          paymentUrl: response.data.paymentUrl,
        });
      } catch (err) {
        console.error(
          "❌ ERROR PayPhone:",
          err?.response?.data || err.message
        );

        return res.status(500).json({
          error: "Error interno PayPhone",
          details: err?.response?.data || err.message,
        });
      }
    });
  });
