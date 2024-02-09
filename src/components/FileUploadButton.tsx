import React, { RefObject, useState } from "react";
import Button, { ButtonProps } from "@mui/joy/Button";
import { styled } from "@mui/joy";

const VisuallyHiddenInput = styled("input")`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

type FileUploadButtonProps = ButtonProps & {
  inputElementRef: RefObject<HTMLInputElement>;
  onFileUploadComplete: (contents: string) => Promise<void>;
};

export default function FileUploadButton({
  onFileUploadComplete,
  ...props
}: FileUploadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target?.files?.item(0);

    if (file) {
      try {
        const content = await readFileAsync(file);
        await onFileUploadComplete(content);
      } catch (error) {
        console.error("Error reading file:", error);
      }
    }
  };

  const readFileAsync = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      //  TODO should this be 'onloadend'?
      reader.onload = (event) => {
        resolve(event.target?.result?.toString() || "");
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(file);
    });
  };

  return (
    <Button
      component="label"
      role={undefined}
      tabIndex={-1}
      loading={loading}
      loadingPosition="start"
      {...props}
    >
      Upload a file
      <VisuallyHiddenInput
        ref={props.inputElementRef}
        type="file"
        onChange={handleFileChange}
        accept=".json"
        onClick={() => setLoading(true)}
      />
    </Button>
  );
}
