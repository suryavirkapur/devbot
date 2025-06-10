// export const brdCreateFromPdf = async (req: Request, res: Response) => {
//   const pdfFile = (req as Request & { file: Express.Multer.File }).file;
//   console.log("Received BRD creation from PDF attempt.");

//   if (!pdfFile) {
//     console.error("No PDF file uploaded.");
//     res.status(400).json({
//       message: "No PDF file uploaded. Please upload a file named 'pdfFile'.",
//     });
//   }

//   console.log(
//     `Uploaded file: ${pdfFile.originalname}, Size: ${pdfFile.size} bytes, MimeType: ${pdfFile.mimetype}`
//   );

//   try {
//     console.log("--- Attempting to extract BRD from PDF using AI ---");

//     // The prompt guides the AI on what to do with the PDF and how to structure the output.
//     // Be as specific as possible for better results.
//     const extractionPrompt = `
//       Analyze the content of the attached PDF document, which is expected to contain information
//       related to a project or business initiative. Your task is to extract all relevant details
//       and structure them into a Business Requirements Document (BRD) according to the provided schema.

//       Focus on identifying and populating the following fields if information is available in the PDF:
//       - projectTitle: The main title or name of the project.
//       - projectOverview: A brief summary or introduction to the project.
//       - goals: Key objectives the project aims to achieve.
//       - scope: What is included (inScope) and excluded (outOfScope) from the project.
//       - stakeholders: Individuals, groups, or organizations involved or affected by the project.
//       - functionalRequirements: Specific functions the system or product must perform.
//       - nonFunctionalRequirements: Qualities of the system (e.g., performance, security, usability).
//       - userStories: Descriptions of features from an end-user perspective.
//       - assumptions: Factors believed to be true without proof for planning purposes.
//       - constraints: Limitations or restrictions affecting the project.
//       - risks: Potential problems that could negatively impact the project.
//       - successMetrics: How the success of the project will be measured.

//       If some information for a field is not present in the PDF, you may omit the field if it's optional
//       or provide a sensible default like an empty array or a placeholder string like "Not specified in PDF"
//       if the schema requires it and it makes sense. Adhere strictly to the schema definition.
//     `;

//     const { object: extractedBRDData } = await generateObject({
//       model: openai("gpt-4o"), // Or "gpt-4o-2024-08-06" or other capable model
//       // structuredOutputs: true, // Implicitly handled by generateObject
//       schema: BRDCreatePayloadSchema, // Your Zod schema for the BRD structure
//       schemaName: "BRD",
//       schemaDescription:
//         "Schema for a Business Requirements Document (BRD) extracted from a PDF.",
//       messages: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "text",
//               text: extractionPrompt,
//             },
//             {
//               type: "file",
//               data: pdfFile.buffer, // Pass the file buffer
//               mimeType: pdfFile.mimetype, // e.g., 'application/pdf'
//             },
//           ],
//         },
//       ],
//     });

//     console.log("--- BRD Data Extracted from PDF by AI ---");
//     console.log(JSON.stringify(extractedBRDData, null, 2));
//     console.log("-------------------------------------------");

//     // At this point, extractedBRDData should conform to BRDCreatePayloadSchema
//     // because generateObject enforces it.
//     // You could add an explicit validation step if you're paranoid:
//     // const validationResult = BRDCreatePayloadSchema.safeParse(extractedBRDData);
//     // if (!validationResult.success) { /* handle error */ }

//     const newBRD: BRDDocument = {
//       ...(extractedBRDData as z.infer<typeof BRDCreatePayloadSchema>), // Type assertion
//       id: uuid(),
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     console.log("--- Final BRD Document Created ---");
//     console.log(JSON.stringify(newBRD, null, 2));
//     console.log("----------------------------------");

//     res.status(201).json({
//       message: "BRD successfully created from PDF!",
//       data: newBRD,
//     });
//   } catch (error: any) {
//     console.error("Error processing PDF for BRD creation:", error);
//     let errorMessage = "Failed to create BRD from PDF.";
//     if (error.message) {
//       errorMessage += ` Details: ${error.message}`;
//     }
//     if (error.cause && error.cause.message) {
//       errorMessage += ` AI Error: ${error.cause.message}`;
//     } else if (error.type && error.message) {
//       errorMessage += ` OpenAI API Error (${error.type}): ${error.message}`;
//     }

//     res.status(500).json({
//       message: errorMessage,
//       // ...(process.env.NODE_ENV !== 'production' && { errorDetails: error }), // Optionally send more details in dev
//     });
//   }
// };
