import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { BRDCreatePayload, BRDCreatePayloadSchema } from "../types/brd";
import { exec as callbackExec } from "child_process";
import util from "util";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const exec = util.promisify(callbackExec);

const BASE_GENERATED_REPOS_PATH = path.join(
  __dirname,
  "../../../generated_repos"
);

const ensureDirectoryExists = async (dirPath: string) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Directory does not exist, create it
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Directory created: ${dirPath}`);
  }
};

const FileGenerationInfoSchema = z.object({
  path: z
    .string()
    .describe(
      "The full path of the file to be created, relative to the project root."
    ),
  description: z
    .string()
    .describe(
      "A detailed description of the code or content that should be in this file."
    ),
});

const ProjectStructureWithDescriptionsSchema = z.object({
  files: z
    .array(FileGenerationInfoSchema)
    .describe("An array of files to be generated for the project."),
});

export const generateRepo = async (req: Request, res: Response) => {
  console.log("Received repository generation request:", req.body);

  const validationResult = BRDCreatePayloadSchema.safeParse(req.body);

  if (!validationResult.success) {
    console.error(
      "Validation Failed for repo generation:",
      validationResult.error.format()
    );
    return res.status(400).json({
      message: "Invalid BRD data provided for repository generation.",
      errors: validationResult.error.flatten().fieldErrors,
    });
  }

  const brdData: BRDCreatePayload = validationResult.data;

  const projectNameSlug = brdData.projectName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  if (!projectNameSlug) {
    return res.status(400).json({
      message: "Project name is invalid or results in an empty slug.",
    });
  }

  const projectPath = path.join(BASE_GENERATED_REPOS_PATH, projectNameSlug);

  try {
    await ensureDirectoryExists(BASE_GENERATED_REPOS_PATH);

    try {
      await fs.access(projectPath);
      console.warn(
        `Project directory ${projectPath} already exists. Removing existing directory.`
      );
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (e) {
      // Directory does not exist, which is fine.
    }
    // Work on Project Structure

    const { object: projectStructure } = await generateObject({
      model: openai("gpt-4o-2024-08-06", {
        structuredOutputs: true,
      }),
      schema: ProjectStructureWithDescriptionsSchema,
      prompt: `Generate a project structure with a detailed description for each file's content based on the following project description. This structure will be used to generate each file. Project description: ${JSON.stringify(
        brdData,
        null,
        2
      )}`,
    });

    console.log("--- Project Structure with Descriptions ---");
    console.log(JSON.stringify(projectStructure, null, 2));
    console.log("--- End of Project Structure with Descriptions ---");

    await fs.mkdir(projectPath, { recursive: true });

    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "OPENAI_API_KEY environment variable not set. The 'codex' command might fail."
      );
    }

    const brdString = JSON.stringify(brdData);

    const generationPromises = projectStructure.files.map((fileInfo) => {
      const prompt = `Create the file '${fileInfo.path}'. The file should contain code that does the following: "${fileInfo.description}". The overall project context is: ${brdString}. Create the file and its content. Do not ask for confirmation.`;
      const escapedPrompt = prompt.replace(/'/g, "'\\''");

      const command = `codex -a auto-edit --quiet '${escapedPrompt}'`;

      console.log(`Executing codex auto-edit for ${fileInfo.path}`);

      return exec(command, {
        cwd: projectPath,
        env: { ...process.env },
      });
    });

    const results = await Promise.all(generationPromises);

    const allStdout = results.map((r) => r.stdout).join("\n");
    const allStderr = results
      .map((r) => r.stderr)
      .filter(Boolean)
      .join("\n");

    console.log(`Codex stdout:\n${allStdout}`);
    if (allStderr) {
      console.error(`Codex stderr:\n${allStderr}`);
    }

    res.status(201).json({
      message: `Project structure for '${brdData.projectName}' generated successfully via codex!`,
      path: projectPath,
      details: allStdout,
    });
  } catch (error: any) {
    console.error("Error generating repository structure:", error);
    res.status(500).json({
      message: "Failed to generate repository structure.",
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    });
  }
};
