import express from 'express';
import cors from 'cors';
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontEnd"))); // Serve frontend
const PORT = 3001;
// let aiOutput = "";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

app.post('/chat', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

         const aiOutput = await main(question);
        //  console.log("AI Output:", aiOutput);
        return res.json({ output: aiOutput });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontEnd", "index.html"));
});




async function main(userquestion) {
    const messages = [
        {
            role: "system",
            content: `You are Buddhe, a friendly ai assistence for a girl and behave like you are in love with her. When calling the webSearch tool, pass {"query": string}.`
        }
    ];

    messages.push({ role: "user", content: userquestion });

    while (true) {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 1,
            messages,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "webSearch",
                        description: "Search the web for relevant information.",
                        parameters: {
                            type: "object",
                            properties: { query: { type: "string" } },
                            required: ["query"]
                        }
                    }
                }
            ],
            tool_choice: "auto"
        });

        const message = completion.choices[0].message;
        messages.push(message);

        // If no tool calls → response is ready
        if (!message.tool_calls) {
            return message.content;
            // break;
        }

        // Handle tool call
        for (const tool of message.tool_calls) {
            const args = JSON.parse(tool.function.arguments);

            if (tool.function.name === "webSearch") {
                const result = await webSearch(args);

                messages.push({
                    tool_call_id: tool.id,
                    role: "tool",
                    name: "webSearch",
                    content: JSON.stringify(result)
                });
            }
        }
    }
}



async function webSearch({ query }) {
    console.log("Web Searching…");

    const response = await tvly.search(query);

    return response.results
        .map(r => r.content)
        .join("\n\n");
}


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});