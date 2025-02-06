// src/server.ts
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = 3001;

app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors());

app.post('/ollama', async (req, res) => {
  try {
      const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              model: "codellama:34b",
              prompt: req.body.message,
              context: req.body.context,
              stream: false
          })
      });

      const data = await response.json();
      res.json({ message: data.response, context: data.context });
  } catch (error) {
      console.error("Error communicating with Ollama:", error);
      res.status(500).json({ error: "Failed to fetch response from Ollama" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

