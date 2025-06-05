import React, { useState } from "react";
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
  CoreFeature,
  DataModel,
} from "../schemas";
import { FormInput } from "./FormInput";
import { FormTextarea } from "./FormTextarea";
import { FormSelect } from "./FormSelect";

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
    // Don't render if value is essentially empty, or handle as "N/A"
    // return <div className="mb-2"><span className="font-semibold">{label}: </span><span className="text-slate-500">N/A</span></div>;
    return null; // Or render N/A as above if preferred for all items
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
          Object.keys(data.technologyStack) as Array<
            keyof typeof data.technologyStack
          >
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
                      <li key={index} className="text-slate-600">
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
          {data.coreFeatures.map(
            (
              feature: CoreFeature,
              index: number // Assuming CoreFeature type is imported
            ) => (
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
            )
          )}
        </div>
      )}

      {data.dataModels && data.dataModels.length > 0 && (
        <div>
          <SectionTitle>Data Models</SectionTitle>
          {data.dataModels.map(
            (
              model: DataModel,
              index: number // Assuming DataModel type is imported
            ) => (
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
            )
          )}
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
                <li key={index} className="text-slate-600">
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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BRDCreatePayload>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string>("");
  const [improvedBRDData, setImprovedBRDData] =
    useState<BRDCreatePayload | null>(null);

  const totalSteps = 6;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTechStackChange = (
    category: keyof BRDCreatePayload["technologyStack"],
    values: string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      technologyStack: {
        ...prev.technologyStack,
        [category]: values,
      },
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setErrors({});
    setSubmissionStatus("idle");
    setSubmissionMessage("");
    setImprovedBRDData(null);

    setCurrentCoreFeature({ name: "", description: "", priority: "Medium" });
    setCoreFeatureErrors({});
    setCurrentDataModel({ name: "", fields: "", relationships: "" });
    setDataModelErrors({});
    setCurrentApiReq("");
    setCurrentFrontendTech("");
    setCurrentBackendTech("");
    // setCurrentDatabaseTech(""); // If implemented
    // setCurrentOtherTech(""); // If implemented
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmissionStatus("submitting");
    setSubmissionMessage("");

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
      // Find the first step with an error and navigate to it
      // This is a simplified approach; a more robust solution would map error paths to steps
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
      else setCurrentStep(totalSteps); // Default to last step for other errors or if logic is complex
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3001/api/brd",
        result.data
      );
      console.log("Server Response:", response.data);
      setSubmissionStatus("success");
      setSubmissionMessage(
        "BRD submitted successfully! The enriched version is displayed below."
      );
      setImprovedBRDData(response.data.data);
    } catch (error) {
      console.error("Submission Error:", error);
      setSubmissionStatus("error");
      if (axios.isAxiosError(error) && error.response) {
        // Check if error.response.data.errors is the Zod flattened errors
        if (error.response.data.errors) {
          const backendErrors: FormErrors = {};
          for (const field in error.response.data.errors) {
            backendErrors[field] = error.response.data.errors[field].join(", ");
          }
          setErrors(backendErrors);
          setSubmissionMessage(
            error.response.data.message ||
              "Submission failed due to validation errors from server."
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setCurrentCoreFeature((prev) => ({ ...prev, [name]: value }));
    if (coreFeatureErrors[name as keyof CoreFeatureCreateForm]) {
      setCoreFeatureErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
    const newFeature = createCoreFeatureWithId(result.data);
    setFormData((prev) => ({
      ...prev,
      coreFeatures: [...prev.coreFeatures, newFeature],
    }));
    setCurrentCoreFeature({ name: "", description: "", priority: "Medium" });
  };

  const removeCoreFeature = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      coreFeatures: prev.coreFeatures.filter((cf) => cf.id !== id),
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
  const addFrontendTech = () => {
    if (currentFrontendTech.trim() === "") return;
    handleTechStackChange("frontend", [
      ...formData.technologyStack.frontend,
      currentFrontendTech.trim(),
    ]);
    setCurrentFrontendTech("");
  };
  const removeFrontendTech = (index: number) => {
    handleTechStackChange(
      "frontend",
      formData.technologyStack.frontend.filter((_, i) => i !== index)
    );
  };

  const [currentBackendTech, setCurrentBackendTech] = useState("");
  const addBackendTech = () => {
    if (currentBackendTech.trim() === "") return;
    handleTechStackChange("backend", [
      ...formData.technologyStack.backend,
      currentBackendTech.trim(),
    ]);
    setCurrentBackendTech("");
  };
  const removeBackendTech = (index: number) => {
    handleTechStackChange(
      "backend",
      formData.technologyStack.backend.filter((_, i) => i !== index)
    );
  };
  // TODO: Repeat for database, other tech stack categories

  // --- Data Model Management ---
  const [currentDataModel, setCurrentDataModel] = useState<DataModelCreateForm>(
    { name: "", fields: "", relationships: "" }
  );
  const [dataModelErrors, setDataModelErrors] = useState<
    Partial<Record<keyof DataModelCreateForm, string>>
  >({});

  const handleDataModelInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentDataModel((prev) => ({ ...prev, [name]: value }));
    if (dataModelErrors[name as keyof DataModelCreateForm]) {
      setDataModelErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
    const newDm = createDataModelWithId(result.data);
    setFormData((prev) => ({
      ...prev,
      dataModels: [...prev.dataModels, newDm],
    }));
    setCurrentDataModel({ name: "", fields: "", relationships: "" });
  };

  const removeDataModel = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      dataModels: prev.dataModels.filter((dm) => dm.id !== id),
    }));
  };

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
            {/* Frontend */}
            <div className="mb-4 p-3 border border-slate-200 rounded">
              <h3 className="font-medium mb-2">Frontend Technologies</h3>
              {formData.technologyStack.frontend.map((tech, index) => (
                <div
                  key={`frontend-${index}`}
                  className="flex items-center mb-1"
                >
                  <span className="flex-grow">{tech}</span>
                  <button
                    type="button"
                    onClick={() => removeFrontendTech(index)}
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {formData.technologyStack.frontend.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  No frontend technologies added.
                </p>
              )}
              <div className="flex items-center mt-2">
                <FormInput
                  label=""
                  id="currentFrontendTech"
                  name="currentFrontendTech"
                  value={currentFrontendTech}
                  onChange={(e) => setCurrentFrontendTech(e.target.value)}
                  placeholder="e.g., React"
                  error={errors["technologyStack.frontend"]}
                />
                <button
                  type="button"
                  onClick={addFrontendTech}
                  className="ml-2 px-3 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 whitespace-nowrap text-sm"
                >
                  Add Tech
                </button>
              </div>
              {errors["technologyStack.frontend"] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors["technologyStack.frontend"]}
                </p>
              )}
            </div>

            {/* Backend */}
            <div className="mb-4 p-3 border border-slate-200 rounded">
              <h3 className="font-medium mb-2">Backend Technologies</h3>
              {formData.technologyStack.backend.map((tech, index) => (
                <div
                  key={`backend-${index}`}
                  className="flex items-center mb-1"
                >
                  <span className="flex-grow">{tech}</span>
                  <button
                    type="button"
                    onClick={() => removeBackendTech(index)}
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {formData.technologyStack.backend.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  No backend technologies added.
                </p>
              )}
              <div className="flex items-center mt-2">
                <FormInput
                  label=""
                  id="currentBackendTech"
                  name="currentBackendTech"
                  value={currentBackendTech}
                  onChange={(e) => setCurrentBackendTech(e.target.value)}
                  placeholder="e.g., Node.js"
                  error={errors["technologyStack.backend"]}
                />
                <button
                  type="button"
                  onClick={addBackendTech}
                  className="ml-2 px-3 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 whitespace-nowrap text-sm"
                >
                  Add Tech
                </button>
              </div>
              {errors["technologyStack.backend"] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors["technologyStack.backend"]}
                </p>
              )}
            </div>
            {/* TODO: Implement UI for Database and Other technology stack categories similarly */}
            <p className="text-xs text-slate-500 mb-4">
              Note: Add at least one for frontend, backend, database (as per
              schema, if refined).
            </p>
            {errors["technologyStack"] && ( // General error for the whole stack object
              <p className="mt-1 text-xs text-red-600">
                {errors["technologyStack"]}
              </p>
            )}
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
                No core features added yet. Add at least one.
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
                No data models added yet. Add at least one.
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
              options={AuthenticationTypeSchema.options.map((opt: string) => ({
                // Ensure 'opt' is string
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
                  <span className="flex-grow">{req}</span>
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
                  No API requirements added. Add at least one.
                </p>
              )}
              <div className="flex items-center mt-2">
                <FormInput
                  label=""
                  id="currentApiReq"
                  name="currentApiReq"
                  value={currentApiReq}
                  onChange={(e) => setCurrentApiReq(e.target.value)}
                  placeholder="e.g., GET /users/:id"
                />
                <button
                  type="button"
                  onClick={addApiRequirement}
                  className="ml-2 px-3 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 whitespace-nowrap text-sm"
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
              <p className="text-sky-600 mt-4">Submitting...</p>
            )}
            {submissionStatus === "error" && (
              <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-bold mb-1">{submissionMessage}</p>
                {Object.keys(errors).length > 0 && (
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
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // If submission was successful and we have improved data, show it.
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

  // Otherwise, show the form.
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg my-10">
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
                {submissionStatus === "submitting"
                  ? "Submitting..."
                  : "Submit BRD"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default MultiStepBRDForm;
