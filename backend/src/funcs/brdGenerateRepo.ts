import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { BRDCreatePayload, BRDCreatePayloadSchema } from "../types/brd";
import { exec as callbackExec } from "child_process";
import util from "util";
import { generateObject } from "ai";
import { z } from "zod";
import openai from "../openai";

// Promisify the exec function to use it with async/await
const exec = util.promisify(callbackExec);

// Define the base path for storing generated repositories
const BASE_GENERATED_REPOS_PATH = path.join(
  __dirname,
  "../../../generated_repos"
);

/**
 * Ensures that a directory exists, creating it if it does not.
 * @param dirPath - The absolute path to the directory.
 */
const ensureDirectoryExists = async (dirPath: string) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // If the directory does not exist, create it recursively.
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Directory created: ${dirPath}`);
  }
};

// Zod schema to define the expected structure and dependencies of project files.
// `dependsOn` is required to satisfy API validation, with the description guiding the AI.
const DependencyOrderSchema = z.object({
  files: z
    .array(
      z.object({
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
        dependsOn: z
          .array(z.string())
          .describe(
            "An array of file paths that this file depends on. Provide an empty array [] if there are no dependencies."
          ),
      })
    )
    .describe(
      "An array of files to be generated for the project, ordered by dependency."
    ),
});

/**
 * Express handler to generate a complete code repository based on a BRD.
 * This function orchestrates AI to define a file structure, sorts the files by
 * dependency, and then generates each file sequentially, feeding the content of
 * previously generated files as context for the next.
 */
export const generateRepo = async (req: Request, res: Response) => {
  console.log("Received repository generation request:", req.body);

  // Validate the incoming request body against the BRD schema.
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

  // Sanitize the project name to create a URL-friendly slug.
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
    // Ensure the base directory for all repos exists.
    await ensureDirectoryExists(BASE_GENERATED_REPOS_PATH);

    // Clean up any existing directory for this project to ensure a fresh start.
    try {
      await fs.access(projectPath);
      console.warn(
        `Project directory ${projectPath} already exists. Removing existing directory.`
      );
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (e) {
      // This is expected if the directory does not exist.
    }

    // Create the main project directory.
    await fs.mkdir(projectPath, { recursive: true });

    // Step 1: Generate the project file structure with dependencies using AI.
    console.log("Generating project structure with dependencies...");
    const { object: dependencyStructure } = await generateObject({
      model: openai("gpt-4.1", { structuredOutputs: true }),
      schema: DependencyOrderSchema,
      prompt: `Create a dependency-ordered project structure based on the following description. For each file, specify its dependencies using the 'dependsOn' array. This structure will be used to generate each file sequentially. Project description: ${JSON.stringify(
        brdData,
        null,
        2
      )}`,
    });
    console.log("--- Project Structure with Dependencies ---");
    console.log(JSON.stringify(dependencyStructure, null, 2));
    console.log("--- End of Project Structure with Dependencies ---");

    // Step 2: Topologically sort the files to respect the dependency graph.
    const sortedFiles = topologicalSort(dependencyStructure.files);
    console.log("--- Topologically Sorted File Generation Order ---");
    console.log(sortedFiles.map((f) => f.path).join(" -> "));
    console.log("--- End of File Generation Order ---");

    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "OPENAI_API_KEY environment variable not set. The 'codex' command might fail."
      );
    }

    const brdString = JSON.stringify(brdData);
    const context: Record<string, string> = {};

    // Step 3: Generate each file sequentially, providing context from previous files.
    for (const fileInfo of sortedFiles) {
      const contextString = Object.entries(context)
        .map(
          ([path, content]) =>
            `\n\n### FILE: ${path}\n\`\`\`\n${content.slice(0, 2500)}\n\`\`\``
        ) // Truncate for brevity
        .join("");
      const fullPath = path.join(projectPath, fileInfo.path);

      //Explicitly create the directory for the file before writing it.
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      //Explicitly write the generated content to the file.
      await fs.writeFile(fullPath, "", "utf-8");
      console.log(`Successfully created file: ${fullPath}`);
      // Prompt for generating raw code, without any extra text or markdown.
      const prompt = `
Based on the following project details, generate the complete and raw source code for the file: ${
        fileInfo.path
      }.

**File Description:**
${fileInfo.description}

**Overall Project Context:**
${brdString}

**Relevant Existing Files (for context and correct imports):**
${contextString || "No files have been created yet. This is the first file."}
`;
      const escapedPrompt = prompt.replace(/'/g, "'\\''");
      const command = `codex -m gpt-4.1 -p openai -a full-auto --quiet '${escapedPrompt}'`;

      console.log(`Generating content for ${fileInfo.path}...`);

      // Execute the codex command to get the file content from stdout.
      const { stdout, stderr } = await exec(command, {
        cwd: projectPath,
        env: { ...process.env },
      });
      if (stdout) {
        // Remove any trailing newlines or spaces from the output.
        const fileContent = stdout.trim();

        if (!fileContent) {
          console.warn(
            `No content generated for ${fileInfo.path}. The file will be empty.`
          );
        } else {
          console.log(
            `Generated content for ${fileInfo.path}:\n${fileContent}`
          );
        }
      } else {
        console.error(
          `No content generated for ${fileInfo.path}. Check stderr for details.`
        );
      }
      if (stderr) {
        console.warn(
          `Stderr received during generation of ${fileInfo.path}:\n${stderr}`
        );
      }

      // Update the context with the newly created file's content for the next iteration.
      context[fileInfo.path] = await fs.readFile(fullPath, "utf-8");
    }

    res.status(201).json({
      message: `Project '${brdData.projectName}' generated successfully!`,
      path: projectPath,
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

/**
 * Performs a topological sort on an array of files with dependencies.
 * @param files - An array of file objects, each with a path and a `dependsOn` array.
 * @returns A new array of file objects sorted in dependency order.
 * @throws An error if a circular dependency is detected.
 */
type FileWithDeps = { path: string; description: string; dependsOn: string[] };
function topologicalSort(files: FileWithDeps[]): FileWithDeps[] {
  const sorted: FileWithDeps[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const fileMap = new Map(files.map((f) => [f.path, f]));

  const visit = (file: FileWithDeps | undefined) => {
    if (!file) return;

    if (visited.has(file.path)) return;
    if (visiting.has(file.path)) {
      throw new Error(`Circular dependency detected involving: ${file.path}`);
    }

    visiting.add(file.path);

    file.dependsOn.forEach((depPath) => {
      const depFile = fileMap.get(depPath);
      if (depFile) {
        visit(depFile);
      } else {
        console.warn(
          `Warning: Dependency '${depPath}' for file '${file.path}' not found. Skipping.`
        );
      }
    });

    visiting.delete(file.path);
    visited.add(file.path);
    sorted.push(file);
  };

  files.forEach((file) => {
    if (!visited.has(file.path)) {
      visit(file);
    }
  });

  return sorted;
}
