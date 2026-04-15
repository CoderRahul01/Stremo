import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // In-memory state for real-time stats (for MVP)
  const streamStats: Record<string, { viewers: Set<string>, likes: number }> = {};

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-stream", ({ streamId, userId, userName }) => {
      socket.join(streamId);
      
      if (!streamStats[streamId]) {
        streamStats[streamId] = { viewers: new Set(), likes: 0 };
      }
      
      streamStats[streamId].viewers.add(socket.id);
      
      // Broadcast updated viewer count
      io.to(streamId).emit("stats-update", {
        viewerCount: streamStats[streamId].viewers.size,
        likesCount: streamStats[streamId].likes
      });

      console.log(`User ${userName} (${socket.id}) joined stream ${streamId}`);
    });

    socket.on("leave-stream", (streamId) => {
      socket.leave(streamId);
      if (streamStats[streamId]) {
        streamStats[streamId].viewers.delete(socket.id);
        io.to(streamId).emit("stats-update", {
          viewerCount: streamStats[streamId].viewers.size,
          likesCount: streamStats[streamId].likes
        });
      }
    });

    socket.on("like-stream", (streamId) => {
      if (streamStats[streamId]) {
        streamStats[streamId].likes += 1;
        io.to(streamId).emit("stats-update", {
          viewerCount: streamStats[streamId].viewers.size,
          likesCount: streamStats[streamId].likes
        });
      }
    });

    socket.on("send-message", (data) => {
      io.to(data.streamId).emit("receive-message", data);
    });

    socket.on("donation", (data) => {
      io.to(data.streamId).emit("receive-donation", data);
    });

    socket.on("disconnect", () => {
      // Clean up viewer counts across all streams
      for (const streamId in streamStats) {
        if (streamStats[streamId].viewers.has(socket.id)) {
          streamStats[streamId].viewers.delete(socket.id);
          io.to(streamId).emit("stats-update", {
            viewerCount: streamStats[streamId].viewers.size,
            likesCount: streamStats[streamId].likes
          });
        }
      }
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
