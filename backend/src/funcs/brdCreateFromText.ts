import { generateObject } from "ai";
import {
  BRDCreatePayloadSchema,
  BRDTextCreatePayloadSchema,
} from "../types/brd";

import { v4 as uuid } from "uuid";

import { Request, Response } from "express";
import openai, { AZURE_OPENAI_DEPLOYMENT_NAME } from "../openai";

export const brdCreateFromText = async (req: Request, res: Response) => {
  console.log("Received BRD from text submission attempt:", req.body);

  const validationResult = BRDTextCreatePayloadSchema.safeParse(req.body);

  if (!validationResult.success) {
    console.error("Validation Failed:", validationResult.error.format());
    return res.status(400).json({
      message: "Invalid data provided.",
      errors: validationResult.error.flatten().fieldErrors,
    });
  }

  const { businessInfo } = validationResult.data;

  try {
    const { object: brdData } = await generateObject({
      model: openai(AZURE_OPENAI_DEPLOYMENT_NAME, {
        structuredOutputs: true,
      }),
      schemaName: "BRD",
      schemaDescription: "Schema for a Business Requirements Document (BRD)",
      schema: BRDCreatePayloadSchema,
      prompt: `Generate a structured Business Requirements Document (BRD) from the following business information. Fill out all the fields of the BRD schema based on the provided text. \n\nBusiness Information:\n${businessInfo}`,
    });

    const newBRD = {
      ...brdData,
      id: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("--- Generated BRD Data ---");
    console.log(JSON.stringify(newBRD, null, 2));
    console.log("----------------------------");

    res.status(201).json({
      message: "BRD created successfully from text.",
      data: newBRD,
    });
  } catch (error) {
    console.error("Error generating BRD from text:", error);
    res.status(500).json({
      message: "Failed to generate BRD from text.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
