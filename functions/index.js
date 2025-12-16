const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors");

admin.initializeApp();

const corsHandler = cors({ origin: true });

exports.createPayphonePayment = functions
  .region("us-central1")
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { rifaId, numero, nombre, telefono, monto } = req.body;

        const montoNumber = Number(monto);

        if (
          !rifaId ||
          !numero ||
          !nombre ||
          !telefono ||
          isNaN(montoNumber) ||
          montoNumber <= 0
        ) {
          return res.status(400).json({
            error: "Datos inválidos o incompletos",
            body: req.body,
          });
        }

        const PAYPHONE_TOKEN = process.env.PAYPHONE_TOKEN;

        if (!PAYPHONE_TOKEN) {
          return res.status(500).json({
            error: "PAYPHONE_TOKEN no configurado",
          });
        }

        const amountCents = Math.round(montoNumber * 100);

        const payload = {
          amount: amountCents,
          amountWithoutTax: amountCents,
          currency: "USD",
          clientTransactionId: `${rifaId}-${numero}-${Date.now()}`,
          responseUrl: "https://predicaconpoder-v4.vercel.app/gracias",
          cancellationUrl: "https://predicaconpoder-v4.vercel.app/cancelado",
        };

        const response = await axios.post(
          "https://pay.payphonetodoesposible.com/api/button/Prepare",
          payload,
          {
            headers: {
              Authorization: `Bearer ${PAYPHONE_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.data?.paymentUrl) {
          return res.status(500).json({
            error: "PayPhone no devolvió paymentUrl",
            response: response.data,
          });
        }

        return res.json({
          paymentUrl: response.data.paymentUrl,
        });
      } catch (error) {
        console.error("PayPhone ERROR:", error.response?.data || error.message);
        return res.status(500).json({
          error: "Error PayPhone",
          detail: error.response?.data || error.message,
        });
      }
    });
  });
