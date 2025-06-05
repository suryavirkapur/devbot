import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { BRDCreatePayloadSchema, BRDSchema } from "./types/brd";

import { v4 as uuid } from "uuid";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("BRD to Git Backend is running!");
});

app.get("/api/brd/create", async (req: Request, res: Response) => {
  const requestBody: { desc: string } = req.body;
  const result = await generateObject({
    model: openai("gpt-4o-2024-08-06", {
      structuredOutputs: true,
    }),
    schemaName: "BRD",
    schemaDescription: "Schema for a Business Requirements Document (BRD)",
    schema: BRDSchema,
    prompt: `Create a Business Requirements Document (BRD) for the following project description: ${requestBody.desc}`,
  });

  console.log(JSON.stringify(result.object, null, 2));
  res.json({
    message: "Create BRD endpoint is working!",
    data: result.object,
  });
});

// Endpoint to capture BRD data
app.post("/api/brd", async (req, res) => {
  console.log("Received BRD submission attempt:", req.body);

  const validationResult = BRDCreatePayloadSchema.safeParse(req.body);

  if (!validationResult.success) {
    console.error("Validation Failed:", validationResult.error.format());
    return res.status(400).json({
      message: "Invalid data provided.",
      errors: validationResult.error.flatten().fieldErrors, // More structured errors
    });
  }

  // If data is valid
  const validData = validationResult.data;

  // Here you would typically save to a database or other persistence layer
  // For this example, we'll "finalize" the BRD object with an ID and timestamps
  const newBRD = {
    ...validData,
    id: uuid(), // Generate a unique ID for the BRD itself
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log("--- Valid BRD Data Received & Processed ---");
  console.log(JSON.stringify(newBRD, null, 2));
  console.log("-------------------------------------------");
  const result = await generateObject({
    model: openai("gpt-4o-2024-08-06", {
      structuredOutputs: true,
    }),
    schemaName: "BRD",
    schemaDescription: "Schema for a Business Requirements Document (BRD)",
    schema: BRDCreatePayloadSchema,
    prompt: `Improve the Business Requirements Document (BRD) for the following project description: ${JSON.stringify(
      newBRD,
      null,
      2
    )}`,
  });
  console.log("------- Improved BRD Data Received --------");
  console.log(JSON.stringify(result.object, null, 2));
  console.log("-------------------------------------------");
  res.status(201).json({
    message: "Create BRD endpoint is working!",
    data: result.object,
  });
});

// app.use("/api/brds");

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
function uuidv4() {
  throw new Error("Function not implemented.");
}
