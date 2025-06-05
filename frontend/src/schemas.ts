import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const CoreFeatureCreateFormSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  description: z.string().min(1, "Description cannot be empty"),
  priority: z.enum(["High", "Medium", "Low"]),
});
export type CoreFeatureCreateForm = z.infer<typeof CoreFeatureCreateFormSchema>;

export const CoreFeatureSchema = CoreFeatureCreateFormSchema.extend({
  id: z.string().uuid(),
});
export type CoreFeature = z.infer<typeof CoreFeatureSchema>;

export const DataModelCreateFormSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  fields: z.string().min(1, "Fields description cannot be empty"),
  relationships: z.string().min(1, "Relationships description cannot be empty"),
});
export type DataModelCreateForm = z.infer<typeof DataModelCreateFormSchema>;

export const DataModelSchema = DataModelCreateFormSchema.extend({
  id: z.string().uuid(),
});
export type DataModel = z.infer<typeof DataModelSchema>;

export const TechnologyStackSchema = z.object({
  frontend: z.array(z.string().min(1, "Frontend tech cannot be empty.")),
  backend: z.array(z.string().min(1, "Backend tech cannot be empty.")),
  database: z.array(z.string().min(1, "Database tech cannot be empty.")),
  other: z.array(z.string().min(1, "Other tech cannot be empty.")),
});
export type TechnologyStack = z.infer<typeof TechnologyStackSchema>;

export const AuthenticationTypeSchema = z.enum([
  "none",
  "basic",
  "oauth",
  "jwt",
]);
export type AuthenticationType = z.infer<typeof AuthenticationTypeSchema>;

export const BRDCreatePayloadSchema = z.object({
  projectName: z.string().min(1, "Project name cannot be empty"),
  projectDescription: z.string().min(1, "Project description cannot be empty"),
  technologyStack: TechnologyStackSchema,
  coreFeatures: z
    .array(CoreFeatureSchema)
    .min(1, "At least one core feature is required."),
  dataModels: z
    .array(DataModelSchema)
    .min(1, "At least one data model is required."),
  authentication: AuthenticationTypeSchema,
  apiRequirements: z
    .array(z.string().min(1, "API requirement cannot be empty."))
    .min(1, "At least one API requirement is required."),
  additionalRequirements: z.string().nullable().optional(),
});
export type BRDCreatePayload = z.infer<typeof BRDCreatePayloadSchema>;

export const BRDSchema = BRDCreatePayloadSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type BRD = z.infer<typeof BRDSchema>;

export const createCoreFeatureWithId = (
  data: CoreFeatureCreateForm
): CoreFeature => ({
  ...data,
  id: uuidv4(),
});

export const createDataModelWithId = (
  data: DataModelCreateForm
): DataModel => ({
  ...data,
  id: uuidv4(),
});
