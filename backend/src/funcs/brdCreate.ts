import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { BRDCreatePayloadSchema } from "../types/brd";

import { v4 as uuid } from "uuid";

import { Request, Response } from "express";

export const brdCreate = async (req: Request, res: Response) => {
  console.log("Received BRD submission attempt:", req.body);

  const validationResult = BRDCreatePayloadSchema.safeParse(req.body);

  if (!validationResult.success) {
    console.error("Validation Failed:", validationResult.error.format());
    return res.status(400).json({
      message: "Invalid data provided.",
      errors: validationResult.error.flatten().fieldErrors,
    });
  }

  const validData = validationResult.data;

  const newBRD = {
    ...validData,
    id: uuid(),
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
};
