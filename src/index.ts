import type { Core } from "@strapi/strapi";
import WebSocket from "ws";

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const wss = new WebSocket.Server({ port: 1338 });

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
            timestamp: savedMessage.createdAt, // ✅ Fix timestamp issue
          });

          // ✅ Broadcast message to everyone EXCEPT the sender
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
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

    console.log("🚀 WebSocket server running on ws://localhost:1338");
  },
};
