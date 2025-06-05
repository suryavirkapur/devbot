import { z } from "zod";

export const CoreFeatureSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name cannot be empty"),
  description: z.string().min(1, "Description cannot be empty"),
  priority: z.enum(["High", "Medium", "Low"]),
});
export type CoreFeature = z.infer<typeof CoreFeatureSchema>;

export const DataModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name cannot be empty"),
  fields: z.string(),
  relationships: z.string(),
});
export type DataModel = z.infer<typeof DataModelSchema>;

export const TechnologyStackSchema = z.object({
  frontend: z.array(z.string()),
  backend: z.array(z.string()),
  database: z.array(z.string()),
  other: z.array(z.string()),
});
export type TechnologyStack = z.infer<typeof TechnologyStackSchema>;

export const AuthenticationTypeSchema = z.enum([
  "none",
  "basic",
  "oauth",
  "jwt",
]);
export type AuthenticationType = z.infer<typeof AuthenticationTypeSchema>;

export const BRDSchema = z.object({
  id: z.string().uuid(),
  projectName: z.string().min(1, "Project name cannot be empty"),
  projectDescription: z.string().min(1, "Project description cannot be empty"),
  technologyStack: TechnologyStackSchema,
  coreFeatures: z.array(CoreFeatureSchema),
  dataModels: z.array(DataModelSchema),
  authentication: AuthenticationTypeSchema,
  apiRequirements: z.array(z.string()),
  additionalRequirements: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type BRD = z.infer<typeof BRDSchema>;

export const BRDCreatePayloadSchema = BRDSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type BRDCreatePayload = z.infer<typeof BRDCreatePayloadSchema>;

export const BRDUpdatePayloadSchema = BRDCreatePayloadSchema.partial();
export type BRDUpdatePayload = z.infer<typeof BRDUpdatePayloadSchema>;
