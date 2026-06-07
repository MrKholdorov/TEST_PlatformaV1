/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data-store.json");

async function startServer() {
  const app = express();
  
  // Set json size limits for larger batch uploads
  app.use(express.json({ limit: "15mb" }));

  // API Route: GET current server-side database
  app.get("/api/db/data", (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        return res.json({ success: true, data: parsed });
      } else {
        return res.json({ success: true, data: null });
      }
    } catch (error) {
      console.error("Failed to read server DB:", error);
      return res.status(500).json({ success: false, error: "Database reading error" });
    }
  });

  // API Route: POST store synchronized database state
  app.post("/api/db/save", (req, res) => {
    try {
      const { payload } = req.body;
      if (!payload) {
        return res.status(400).json({ success: false, error: "Payload parameters missing" });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), "utf-8");
      return res.json({ success: true });
    } catch (error) {
      console.error("Failed to write server DB:", error);
      return res.status(500).json({ success: false, error: "Database saving error" });
    }
  });

  // Vite development integration or server production files compression
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running synchronized at http://localhost:${PORT}`);
  });
}

startServer();
