import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { BRDCreatePayload, BRDCreatePayloadSchema } from "../types/brd";
import { exec as callbackExec } from "child_process";
import util from "util";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";

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

    const result = await generateText({
    model: openai("gpt-4o-2024-08-06", {
      structuredOutputs: true,
    }),
    prompt: `Generate a project structure for the following project description: ${JSON.stringify(
      brdData,
      null,
      2
    )}`,
    });

    console.log("--- Project Structure ---");
    console.log(result.text);
    console.log("--- End of Project Structure ---");

    await fs.mkdir(projectPath, { recursive: true });

    const brdString = JSON.stringify(brdData);
    const escapedBrdString = brdString.replace(/'/g, "'\\''");

    const command = `codex -a auto-edit --quiet '${escapedBrdString} ${result.text} Do not ask me anything just do it on your own.' `;
    console.log(`Executing codex auto-edit in ${projectPath}`);

    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "OPENAI_API_KEY environment variable not set. The 'codex' command might fail."
      );
    }

    const { stdout, stderr } = await exec(command, {
      cwd: projectPath,
      env: {
        ...process.env,
      },
    });

    console.log(`Codex stdout:\n${stdout}`);
    if (stderr) {
      console.error(`Codex stderr:\n${stderr}`);
    }

    res.status(201).json({
      message: `Project structure for '${brdData.projectName}' generated successfully via codex!`,
      path: projectPath,
      details: stdout,
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
