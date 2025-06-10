import React, { useState } from "react";
import { Button } from "./common/Button";
import { Textarea } from "./common/Textarea";

interface BRDFromTextGeneratorProps {
  onBrdGenerated: (brdData: any) => void;
}

export const BRDFromTextGenerator: React.FC<BRDFromTextGeneratorProps> = ({
  onBrdGenerated,
}) => {
  const [businessInfo, setBusinessInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!businessInfo.trim()) {
      setError("Business information cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:3001/api/brds/create-from-text",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ businessInfo }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate BRD.");
      }

      const result = await response.json();
      onBrdGenerated(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Generate BRD from Text</h2>
      <p className="text-sm text-gray-500">
        Describe your project, and we'll generate the Business Requirements
        Document for you.
      </p>
      <Textarea
        placeholder="Enter all the business information for your project here..."
        className="min-h-[200px]"
        value={businessInfo}
        onChange={(e) => setBusinessInfo(e.target.value)}
        disabled={isLoading}
      />
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate BRD"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}; 