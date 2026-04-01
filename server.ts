import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // AI Debugging Endpoint
  app.post("/api/debug", async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(401).json({ 
        error: "API Key not found. Please add your GEMINI_API_KEY to the Secrets panel in AI Studio or use the 'Configure API Key' button in the app." 
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      const prompt = `You are a professional code debugger. Analyze the following ${language || 'code'} and provide a structured response.
      
      Code to analyze:
      \`\`\`${language || ''}
      ${code}
      \`\`\`
      
      Return the response in JSON format with the following structure:
      {
        "errors": ["list of errors found"],
        "fixes": ["list of specific fix suggestions"],
        "optimizedCode": "the complete improved and optimized version of the code",
        "explanation": "a detailed explanation of why the errors occurred and how the fixes address them"
      }`;

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              errors: { type: Type.ARRAY, items: { type: Type.STRING } },
              fixes: { type: Type.ARRAY, items: { type: Type.STRING } },
              optimizedCode: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["errors", "fixes", "optimizedCode", "explanation"],
          },
        },
      });

      const responseText = result.text;
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("AI Debug Error:", error);
      const errorMessage = error.message || "Failed to analyze code.";
      res.status(500).json({ error: errorMessage });
    }
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
