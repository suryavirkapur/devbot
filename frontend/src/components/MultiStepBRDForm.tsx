import React, { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import {
  BRDCreatePayload,
  BRDCreatePayloadSchema,
  CoreFeatureCreateForm,
  CoreFeatureCreateFormSchema,
  createCoreFeatureWithId,
  DataModelCreateForm,
  DataModelCreateFormSchema,
  createDataModelWithId,
  AuthenticationTypeSchema,
  TechnologyStack, // Added for explicit typing
} from "../schemas";
import { FormInput } from "./FormInput";
import { FormTextarea } from "./FormTextarea";
import { FormSelect } from "./FormSelect";
import LoadingSpinner from "./common/LoadingSpinner"; // Make sure this path is correct
import { BRDFromTextGenerator } from "./BRDFromTextGenerator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./common/Card";
import { Button } from "./common/Button";

type FormErrors = Partial<Record<keyof BRDCreatePayload | string, string>>;

const initialFormData: BRDCreatePayload = {
  projectName: "",
  projectDescription: "",
  technologyStack: {
    frontend: [],
    backend: [],
    database: [],
    other: [],
  },
  coreFeatures: [],
  dataModels: [],
  authentication: "none",
  apiRequirements: [],
  additionalRequirements: null,
};

// --- Helper Display Components for Improved BRD ---
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h2 className="text-2xl font-semibold mt-8 mb-3 border-b border-slate-300 pb-2 text-sky-700">
    {children}
  </h2>
);

const SubSectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h3 className="text-xl font-medium mt-4 mb-2 text-slate-800">{children}</h3>
);

const DetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }
  return (
    <div className="mb-3">
      <span className="font-semibold text-slate-700">{label}: </span>
      {typeof value === "string" || typeof value === "number" ? (
        <span className="text-slate-600">{value}</span>
      ) : (
        value
      )}
    </div>
  );
};

const ImprovedBRDDisplay: React.FC<{ data: BRDCreatePayload }> = ({ data }) => {
  if (!data)
    return (
      <p className="text-center text-slate-500">
        No improved BRD data to display.
      </p>
    );

  return (
    <div className="divide-y divide-slate-200">
      <div>
        <SectionTitle>Project Overview</SectionTitle>
        <DetailItem label="Project Name" value={data.projectName} />
        <DetailItem
          label="Description"
          value={
            <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-md">
              {data.projectDescription || "N/A"}
            </p>
          }
        />
      </div>

      <div>
        <SectionTitle>Technology Stack</SectionTitle>
        {(
          Object.keys(data.technologyStack) as Array<keyof TechnologyStack>
        ).map(
          (category) =>
            data.technologyStack[category] &&
            data.technologyStack[category].length > 0 && (
              <div key={category} className="mb-4">
                <SubSectionTitle>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SubSectionTitle>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  {data.technologyStack[category].map(
                    (tech: string, index: number) => (
                      <li
                        key={`${category}-${index}`}
                        className="text-slate-600"
                      >
                        {tech}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )
        )}
        {Object.values(data.technologyStack).every(
          (arr) => arr.length === 0
        ) && <p className="text-slate-500">No technologies specified.</p>}
      </div>

      {data.coreFeatures && data.coreFeatures.length > 0 && (
        <div>
          <SectionTitle>Core Features</SectionTitle>
          {data.coreFeatures.map((feature: CoreFeature, index: number) => (
            <div
              key={feature.id || index}
              className="mb-4 p-4 border border-slate-200 rounded-lg shadow-sm bg-white"
            >
              <SubSectionTitle>
                {feature.name}{" "}
                <span className="ml-2 text-xs font-semibold bg-sky-100 text-sky-700 px-2 py-1 rounded-full align-middle">
                  Priority: {feature.priority}
                </span>
              </SubSectionTitle>
              <p className="text-slate-600 whitespace-pre-wrap">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {data.dataModels && data.dataModels.length > 0 && (
        <div>
          <SectionTitle>Data Models</SectionTitle>
          {data.dataModels.map((model: DataModel, index: number) => (
            <div
              key={model.id || index}
              className="mb-4 p-4 border border-slate-200 rounded-lg shadow-sm bg-white"
            >
              <SubSectionTitle>{model.name}</SubSectionTitle>
              <DetailItem
                label="Fields"
                value={
                  <pre className="bg-slate-100 p-3 rounded text-sm whitespace-pre-wrap text-slate-700">
                    {model.fields || "N/A"}
                  </pre>
                }
              />
              {model.relationships && (
                <DetailItem
                  label="Relationships"
                  value={
                    <pre className="bg-slate-100 p-3 rounded text-sm whitespace-pre-wrap text-slate-700">
                      {model.relationships}
                    </pre>
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <SectionTitle>Authentication & API</SectionTitle>
        <DetailItem
          label="Authentication Type"
          value={
            data.authentication.charAt(0).toUpperCase() +
            data.authentication.slice(1)
          }
        />
        {data.apiRequirements && data.apiRequirements.length > 0 ? (
          <div className="mt-4">
            <SubSectionTitle>API Requirements</SubSectionTitle>
            <ul className="list-disc list-inside ml-4 space-y-1">
              {data.apiRequirements.map((req: string, index: number) => (
                <li key={`api-req-${index}`} className="text-slate-600">
                  {req}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <DetailItem label="API Requirements" value="None specified." />
        )}
      </div>

      {data.additionalRequirements && (
        <div>
          <SectionTitle>Additional Requirements</SectionTitle>
          <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-md">
            {data.additionalRequirements}
          </p>
        </div>
      )}
      {!data.additionalRequirements && (
        <div>
          <SectionTitle>Additional Requirements</SectionTitle>
          <p className="text-slate-500">None specified.</p>
        </div>
      )}
    </div>
  );
};

// --- Main Form Component ---
const MultiStepBRDForm: React.FC = () => {
  const [creationMode, setCreationMode] = useState<"form" | "text">("form");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BRDCreatePayload>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string>("");
  const [improvedBRDData, setImprovedBRDData] =
    useState<BRDCreatePayload | null>(null);

  // State for Repository Generation
  const [repoGenerationStatus, setRepoGenerationStatus] = useState<
    "idle" | "generating" | "success" | "error"
  >("idle");
  const [repoGenerationMessage, setRepoGenerationMessage] =
    useState<string>("");

  const onBrdGenerated = (brdData: any) => {
    console.log("BRD Generated:", brdData);
    setImprovedBRDData(brdData);
    setFormData(brdData); // Populate form data
    setSubmissionStatus("success");
    setSubmissionMessage("BRD generated from text and populated in the form below for review.");
    setCreationMode("form"); // Switch to form to show populated data
  };
  
  const totalSteps = 6;

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTechStackChange = (
    category: keyof TechnologyStack,
    values: string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      technologyStack: { ...prev.technologyStack, [category]: values },
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setErrors({});
    setSubmissionStatus("idle");
    setSubmissionMessage("");
    setImprovedBRDData(null);
    setRepoGenerationStatus("idle");
    setRepoGenerationMessage("");

    setCurrentCoreFeature({ name: "", description: "", priority: "Medium" });
    setCoreFeatureErrors({});
    setCurrentDataModel({ name: "", fields: "", relationships: "" });
    setDataModelErrors({});
    setCurrentApiReq("");
    setCurrentFrontendTech("");
    setCurrentBackendTech("");
    setCurrentDatabaseTech("");
    setCurrentOtherTech("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmissionStatus("submitting");
    setSubmissionMessage("");
    setRepoGenerationStatus("idle"); // Reset repo generation status for new BRD submission
    setRepoGenerationMessage("");

    const result = BRDCreatePayloadSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      setSubmissionStatus("error");
      setSubmissionMessage("Please correct the errors in the form.");
      console.error("Validation Errors:", newErrors);
      // Navigate to first step with error
      if (newErrors.projectName || newErrors.projectDescription)
        setCurrentStep(1);
      else if (
        Object.keys(newErrors).some((k) => k.startsWith("technologyStack"))
      )
        setCurrentStep(2);
      else if (Object.keys(newErrors).some((k) => k.startsWith("coreFeatures")))
        setCurrentStep(3);
      else if (Object.keys(newErrors).some((k) => k.startsWith("dataModels")))
        setCurrentStep(4);
      else if (
        newErrors.authentication ||
        Object.keys(newErrors).some((k) => k.startsWith("apiRequirements"))
      )
        setCurrentStep(5);
      else setCurrentStep(totalSteps);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3001/api/brds",
        result.data
      ); // Ensure API URL is correct
      console.log("Server Response (BRD Enhancement):", response.data);
      setSubmissionStatus("success");
      setSubmissionMessage(
        "BRD submitted successfully! The enriched version is displayed below."
      );
      setImprovedBRDData(response.data.data as BRDCreatePayload);
    } catch (error) {
      console.error("Submission Error:", error);
      setSubmissionStatus("error");
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.data.errors) {
          const backendErrors: FormErrors = {};
          for (const field in error.response.data.errors) {
            backendErrors[field] = (
              error.response.data.errors[field] as string[]
            ).join(", ");
          }
          setErrors(backendErrors);
          setSubmissionMessage(
            error.response.data.message ||
              "Submission failed due to server validation errors."
          );
        } else {
          setSubmissionMessage(
            `Submission failed: ${
              error.response.data.message || "Server error"
            }`
          );
        }
      } else {
        setSubmissionMessage("Submission failed. Please try again.");
      }
    }
  };

  const handleGenerateRepo = async () => {
    if (!improvedBRDData) {
      setRepoGenerationMessage("No BRD data available to generate repository.");
      setRepoGenerationStatus("error");
      return;
    }
    setRepoGenerationStatus("generating");
    setRepoGenerationMessage("");
    try {
      const response = await axios.post(
        "http://localhost:3001/api/brds/generate-repo",
        improvedBRDData
      );
      setRepoGenerationStatus("success");
      setRepoGenerationMessage(
        response.data.message +
          (response.data.path ? ` (Server path: ${response.data.path})` : "")
      );
      console.log("Repo Generation Response:", response.data);
    } catch (error) {
      console.error("Repository Generation Error:", error);
      setRepoGenerationStatus("error");
      if (axios.isAxiosError(error) && error.response) {
        setRepoGenerationMessage(
          `Repo generation failed: ${
            error.response.data.message || "Server error"
          }`
        );
      } else {
        setRepoGenerationMessage("Repo generation failed. Please try again.");
      }
    }
  };

  // --- Core Features Management ---
  const [currentCoreFeature, setCurrentCoreFeature] =
    useState<CoreFeatureCreateForm>({
      name: "",
      description: "",
      priority: "Medium",
    });
  const [coreFeatureErrors, setCoreFeatureErrors] = useState<
    Partial<Record<keyof CoreFeatureCreateForm, string>>
  >({});
  const handleCoreFeatureInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurrentCoreFeature((prev) => ({ ...prev, [name]: value }));
    if (coreFeatureErrors[name as keyof CoreFeatureCreateForm])
      setCoreFeatureErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const addCoreFeature = () => {
    const result = CoreFeatureCreateFormSchema.safeParse(currentCoreFeature);
    if (!result.success) {
      const newErrors: Partial<Record<keyof CoreFeatureCreateForm, string>> =
        {};
      result.error.errors.forEach(
        (err) =>
          (newErrors[err.path[0] as keyof CoreFeatureCreateForm] = err.message)
      );
      setCoreFeatureErrors(newErrors);
      return;
    }
    setCoreFeatureErrors({});
    setFormData((prev) => ({
      ...prev,
      coreFeatures: [
        ...prev.coreFeatures,
        createCoreFeatureWithId(result.data),
      ],
    }));
    setCurrentCoreFeature({ name: "", description: "", priority: "Medium" });
  };
  const removeCoreFeature = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      coreFeatures: prev.coreFeatures.filter((cf) => cf.id !== id),
    }));
  };

  // --- Data Model Management ---
  const [currentDataModel, setCurrentDataModel] = useState<DataModelCreateForm>(
    { name: "", fields: "", relationships: "" }
  );
  const [dataModelErrors, setDataModelErrors] = useState<
    Partial<Record<keyof DataModelCreateForm, string>>
  >({});
  const handleDataModelInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentDataModel((prev) => ({ ...prev, [name]: value }));
    if (dataModelErrors[name as keyof DataModelCreateForm])
      setDataModelErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const addDataModel = () => {
    const result = DataModelCreateFormSchema.safeParse(currentDataModel);
    if (!result.success) {
      const newErrors: Partial<Record<keyof DataModelCreateForm, string>> = {};
      result.error.errors.forEach(
        (err) =>
          (newErrors[err.path[0] as keyof DataModelCreateForm] = err.message)
      );
      setDataModelErrors(newErrors);
      return;
    }
    setDataModelErrors({});
    setFormData((prev) => ({
      ...prev,
      dataModels: [...prev.dataModels, createDataModelWithId(result.data)],
    }));
    setCurrentDataModel({ name: "", fields: "", relationships: "" });
  };
  const removeDataModel = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      dataModels: prev.dataModels.filter((dm) => dm.id !== id),
    }));
  };

  // --- API Requirements Management ---
  const [currentApiReq, setCurrentApiReq] = useState("");
  const addApiRequirement = () => {
    if (currentApiReq.trim() === "") return;
    setFormData((prev) => ({
      ...prev,
      apiRequirements: [...prev.apiRequirements, currentApiReq.trim()],
    }));
    setCurrentApiReq("");
  };
  const removeApiRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      apiRequirements: prev.apiRequirements.filter((_, i) => i !== index),
    }));
  };

  // --- Tech Stack Item Management ---
  const [currentFrontendTech, setCurrentFrontendTech] = useState("");
  const [currentBackendTech, setCurrentBackendTech] = useState("");
  const [currentDatabaseTech, setCurrentDatabaseTech] = useState("");
  const [currentOtherTech, setCurrentOtherTech] = useState("");

  const addTechItem = (
    category: keyof TechnologyStack,
    item: string,
    setItem: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (item.trim() === "") return;
    handleTechStackChange(category, [
      ...formData.technologyStack[category],
      item.trim(),
    ]);
    setItem("");
  };
  const removeTechItem = (category: keyof TechnologyStack, index: number) => {
    handleTechStackChange(
      category,
      formData.technologyStack[category].filter((_, i) => i !== index)
    );
  };

  // Helper for rendering tech stack section
  const renderTechStackCategory = (
    categoryName: string,
    categoryKey: keyof TechnologyStack,
    currentItem: string,
    setCurrentItem: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string
  ) => (
    <div className="mb-4 p-3 border border-slate-200 rounded">
      <h3 className="font-medium mb-2">{categoryName}</h3>
      {formData.technologyStack[categoryKey].map((tech, index) => (
        <div key={`${categoryKey}-${index}`} className="flex items-center mb-1">
          <span className="flex-grow text-sm">{tech}</span>
          <button
            type="button"
            onClick={() => removeTechItem(categoryKey, index)}
            className="ml-2 text-red-500 hover:text-red-700 text-xs"
          >
            Remove
          </button>
        </div>
      ))}
      {formData.technologyStack[categoryKey].length === 0 && (
        <p className="text-xs text-slate-400 italic">
          No {categoryName.toLowerCase()} added.
        </p>
      )}
      <div className="flex items-end mt-2">
        <FormInput
          label=""
          id={`current${categoryKey}Tech`}
          name={`current${categoryKey}Tech`}
          value={currentItem}
          onChange={(e) => setCurrentItem(e.target.value)}
          placeholder={placeholder}
          // error={errors[`technologyStack.${categoryKey}`]} // This error is for the array as a whole, per Zod. Individual item errors aren't typical here.
          className="mb-0" // Remove default bottom margin from FormInput
        />
        <button
          type="button"
          onClick={() => addTechItem(categoryKey, currentItem, setCurrentItem)}
          className="ml-2 px-3 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 whitespace-nowrap text-sm h-[38px]"
        >
          Add Tech
        </button>
      </div>
      {errors[`technologyStack.${categoryKey}`] && (
        <p className="mt-1 text-xs text-red-600">
          {errors[`technologyStack.${categoryKey}`]}
        </p>
      )}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Project Basics
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Step 1: Project Basics
            </h2>
            <FormInput
              label="Project Name"
              id="projectName"
              name="projectName"
              value={formData.projectName}
              onChange={handleInputChange}
              error={errors["projectName"]}
              required
            />
            <FormTextarea
              label="Project Description"
              id="projectDescription"
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleInputChange}
              error={errors["projectDescription"]}
              required
            />
          </div>
        );
      case 2: // Technology Stack
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Step 2: Technology Stack
            </h2>
            {renderTechStackCategory(
              "Frontend Technologies",
              "frontend",
              currentFrontendTech,
              setCurrentFrontendTech,
              "e.g., React, Vue"
            )}
            {renderTechStackCategory(
              "Backend Technologies",
              "backend",
              currentBackendTech,
              setCurrentBackendTech,
              "e.g., Node.js, Python (Django)"
            )}
            {renderTechStackCategory(
              "Database Technologies",
              "database",
              currentDatabaseTech,
              setCurrentDatabaseTech,
              "e.g., PostgreSQL, MongoDB"
            )}
            {renderTechStackCategory(
              "Other Technologies/Tools",
              "other",
              currentOtherTech,
              setCurrentOtherTech,
              "e.g., Docker, AWS S3"
            )}
            {errors["technologyStack"] && (
              <p className="mt-1 text-xs text-red-600">
                {errors["technologyStack"]}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Note: The schema may require at least one item for some
              categories.
            </p>
          </div>
        );
      case 3: // Core Features
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Step 3: Core Features
            </h2>
            <div className="mb-6 p-4 border border-slate-300 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Add New Core Feature</h3>
              <FormInput
                label="Feature Name"
                name="name"
                value={currentCoreFeature.name}
                onChange={handleCoreFeatureInputChange}
                error={coreFeatureErrors.name}
                required
              />
              <FormTextarea
                label="Description"
                name="description"
                value={currentCoreFeature.description}
                onChange={handleCoreFeatureInputChange}
                error={coreFeatureErrors.description}
                required
              />
              <FormSelect
                label="Priority"
                name="priority"
                value={currentCoreFeature.priority}
                onChange={handleCoreFeatureInputChange}
                options={[
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" },
                ]}
                error={coreFeatureErrors.priority}
                required
              />
              <button
                type="button"
                onClick={addCoreFeature}
                className="mt-2 px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
              >
                Add Feature
              </button>
            </div>
            <h3 className="text-lg font-medium mb-2">
              Added Core Features ({formData.coreFeatures.length})
            </h3>
            {formData.coreFeatures.length === 0 && (
              <p className="text-sm text-slate-500">
                No core features added yet. Schema requires at least one.
              </p>
            )}
            {formData.coreFeatures.map((feature) => (
              <div
                key={feature.id}
                className="mb-2 p-3 border border-slate-200 rounded flex justify-between items-start"
              >
                <div>
                  <p className="font-semibold">
                    {feature.name}{" "}
                    <span className="text-xs font-normal bg-slate-200 px-1.5 py-0.5 rounded">
                      {feature.priority}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">
                    {feature.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCoreFeature(feature.id)}
                  className="ml-2 text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
            {errors["coreFeatures"] && (
              <p className="mt-1 text-xs text-red-600">
                {errors["coreFeatures"]}
              </p>
            )}
          </div>
        );
      case 4: // Data Models
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 4: Data Models</h2>
            <div className="mb-6 p-4 border border-slate-300 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Add New Data Model</h3>
              <FormInput
                label="Model Name"
                name="name"
                value={currentDataModel.name}
                onChange={handleDataModelInputChange}
                error={dataModelErrors.name}
                required
              />
              <FormTextarea
                label="Fields (e.g., username: string, email: string)"
                name="fields"
                value={currentDataModel.fields}
                onChange={handleDataModelInputChange}
                error={dataModelErrors.fields}
                required
              />
              <FormTextarea
                label="Relationships (e.g., User has many Posts)"
                name="relationships"
                value={currentDataModel.relationships}
                onChange={handleDataModelInputChange}
                error={dataModelErrors.relationships}
              />
              <button
                type="button"
                onClick={addDataModel}
                className="mt-2 px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
              >
                Add Data Model
              </button>
            </div>
            <h3 className="text-lg font-medium mb-2">
              Added Data Models ({formData.dataModels.length})
            </h3>
            {formData.dataModels.length === 0 && (
              <p className="text-sm text-slate-500">
                No data models added yet. Schema requires at least one.
              </p>
            )}
            {formData.dataModels.map((dm) => (
              <div
                key={dm.id}
                className="mb-2 p-3 border border-slate-200 rounded flex justify-between items-start"
              >
                <div>
                  <p className="font-semibold">{dm.name}</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    <strong>Fields:</strong> {dm.fields}
                  </p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    <strong>Relationships:</strong> {dm.relationships || "N/A"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeDataModel(dm.id)}
                  className="ml-2 text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
            {errors["dataModels"] && (
              <p className="mt-1 text-xs text-red-600">
                {errors["dataModels"]}
              </p>
            )}
          </div>
        );
      case 5: // Authentication & API
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Step 5: Authentication & API
            </h2>
            <FormSelect
              label="Authentication Type"
              id="authentication"
              name="authentication"
              value={formData.authentication}
              onChange={handleInputChange}
              options={AuthenticationTypeSchema.options.map((opt) => ({
                value: opt,
                label: opt.charAt(0).toUpperCase() + opt.slice(1),
              }))}
              error={errors["authentication"]}
              required
            />
            <div className="mt-6 mb-4 p-3 border border-slate-200 rounded">
              <h3 className="font-medium mb-2">API Requirements</h3>
              {formData.apiRequirements.map((req, index) => (
                <div key={`api-${index}`} className="flex items-center mb-1">
                  <span className="flex-grow text-sm">{req}</span>
                  <button
                    type="button"
                    onClick={() => removeApiRequirement(index)}
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {formData.apiRequirements.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  No API requirements added. Schema requires at least one.
                </p>
              )}
              <div className="flex items-end mt-2">
                <FormInput
                  label=""
                  id="currentApiReq"
                  name="currentApiReq"
                  value={currentApiReq}
                  onChange={(e) => setCurrentApiReq(e.target.value)}
                  placeholder="e.g., GET /users/:id"
                  className="mb-0"
                />
                <button
                  type="button"
                  onClick={addApiRequirement}
                  className="ml-2 px-3 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 whitespace-nowrap text-sm h-[38px]"
                >
                  Add API
                </button>
              </div>
              {errors["apiRequirements"] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors["apiRequirements"]}
                </p>
              )}
            </div>
          </div>
        );
      case 6: // Additional & Submit
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Step 6: Additional Requirements & Submit
            </h2>
            <FormTextarea
              label="Additional Requirements (Optional)"
              id="additionalRequirements"
              name="additionalRequirements"
              value={formData.additionalRequirements ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  additionalRequirements:
                    e.target.value.trim() === "" ? null : e.target.value,
                }))
              }
              error={errors["additionalRequirements"]}
            />
            {submissionStatus === "submitting" && (
              <div className="flex items-center justify-center text-sky-600 mt-4">
                <LoadingSpinner />
                <span className="ml-2">
                  Submitting BRD for AI enhancement...
                </span>
              </div>
            )}
            {submissionStatus === "error" &&
              !Object.keys(errors).length && ( // Show general submission message if no specific field errors
                <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <p className="font-bold">Submission Error</p>
                  <p>{submissionMessage}</p>
                </div>
              )}
            {Object.keys(errors).length > 0 && submissionStatus === "error" && (
              <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-bold mb-1">
                  {submissionMessage ||
                    "Please correct the highlighted errors:"}
                </p>
                <ul className="list-disc list-inside text-sm">
                  {Object.entries(errors).map(
                    ([key, message]) =>
                      message && (
                        <li key={key}>
                          <strong>
                            {key
                              .replace(/\./g, " -> ")
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                            :
                          </strong>{" "}
                          {message}
                        </li>
                      )
                  )}
                </ul>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (submissionStatus === "success" && improvedBRDData) {
    return (
      <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-white shadow-xl rounded-lg my-10">
        <h1 className="text-3xl font-bold mb-3 text-green-700">
          BRD Submitted & Enhanced by AI
        </h1>
        {submissionMessage && (
          <p className="mb-6 text-green-600">{submissionMessage}</p>
        )}
        <ImprovedBRDDisplay data={improvedBRDData} />

        <div className="mt-8 pt-6 border-t border-slate-300">
          <h2 className="text-2xl font-semibold mb-4 text-sky-700">
            Generate Project Files
          </h2>
          {repoGenerationStatus === "idle" && (
            <button
              type="button"
              onClick={handleGenerateRepo}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
            >
              Generate Project Files on Server
            </button>
          )}
          {repoGenerationStatus === "generating" && (
            <div className="flex items-center justify-center text-indigo-600 my-4">
              <LoadingSpinner />{" "}
              <span className="ml-2">Generating repository structure...</span>
            </div>
          )}
          {repoGenerationStatus === "success" && (
            <div className="my-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              <p className="font-bold">Success!</p>
              <p>{repoGenerationMessage}</p>
              <p className="text-xs mt-1">
                Note: Project files created on the server's file system.
              </p>
            </div>
          )}
          {repoGenerationStatus === "error" && (
            <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error!</p>
              <p>{repoGenerationMessage}</p>
            </div>
          )}
          {(repoGenerationStatus === "success" ||
            repoGenerationStatus === "error") &&
            repoGenerationStatus !== "generating" && (
              <button
                type="button"
                onClick={handleGenerateRepo}
                disabled={repoGenerationStatus === "generating"}
                className="mt-2 w-full px-6 py-2 border border-indigo-500 text-indigo-600 font-semibold rounded-md hover:bg-indigo-50 disabled:opacity-50"
              >
                {repoGenerationStatus === "generating"
                  ? "Generating..."
                  : "Re-generate Project Files"}
              </button>
            )}
        </div>

        <button
          type="button"
          onClick={handleResetForm}
          className="mt-10 w-full px-6 py-3 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 transition-colors"
        >
          Create Another BRD
        </button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto my-10">
      <CardHeader>
        <CardTitle>Create a Business Requirements Document</CardTitle>
        <CardDescription>
          Fill out the form below, or generate a BRD from a text description.
        </CardDescription>
        <div className="flex space-x-2 pt-4">
          <Button
            onClick={() => setCreationMode("form")}
            variant={creationMode === "form" ? "default" : "outline"}
          >
            Use Form
          </Button>
          <Button
            onClick={() => setCreationMode("text")}
            variant={creationMode === "text" ? "default" : "outline"}
          >
            Generate from Text
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {creationMode === "text" ? (
          <BRDFromTextGenerator onBrdGenerated={onBrdGenerated} />
        ) : (
          <>
            <div className="mb-6">
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className="bg-sky-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-slate-600 mt-2">
                Step {currentStep} of {totalSteps}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {renderStep()}
              <div className="mt-8 flex justify-between items-center">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
                    >
                      Previous
                    </button>
                  )}
                </div>
                <div>
                  {currentStep < totalSteps && (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
                    >
                      Next
                    </button>
                  )}
                  {currentStep === totalSteps && (
                    <button
                      type="submit"
                      disabled={submissionStatus === "submitting"}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-400"
                    >
                      {submissionStatus === "submitting" ? (
                        <LoadingSpinner />
                      ) : (
                        "Submit BRD & Enhance"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiStepBRDForm;
