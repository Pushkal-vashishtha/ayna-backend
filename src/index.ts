import type { Core } from "@strapi/strapi";
import WebSocket from "ws";

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const server = strapi.server.httpServer; // Attach to existing Strapi server
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws) => {
      console.log("🔗 Client connected");

      ws.on("message", async (message) => {
        console.log("📩 Received:", message.toString());

        try {
          const parsedMessage = JSON.parse(message.toString());

          // ✅ Store message in Strapi
          const savedMessage = await strapi.entityService.create("api::message.message", {
            data: {
              text: parsedMessage.text,
              sender: parsedMessage.sender,
            },
          });

          const broadcastMessage = JSON.stringify({
            id: savedMessage.id,
            text: savedMessage.text,
            sender: savedMessage.sender,
            timestamp: savedMessage.createdAt, // ✅ Fix timestamp retrieval
          });

          // ✅ Broadcast message to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastMessage);
            }
          });
        } catch (error) {
          console.error("❌ Error processing message:", error);
        }
      });

      ws.on("close", () => {
        console.log("❌ Client disconnected");
      });
    });

    console.log(`🚀 WebSocket server running on wss://[YOUR_DEPLOYED_URL]`);
  },
};
