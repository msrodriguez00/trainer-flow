
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface VideoUrlInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
  onValidationChange: (isValid: boolean) => void;
}

// Expresión regular para validar URLs de YouTube
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(?:embed\/|v\/|watch\?v=)|youtu\.be\/)([\w-]{11})(\S*)?$/;

export const VideoUrlInput = ({
  id,
  value,
  onChange,
  hasError,
  onValidationChange,
}: VideoUrlInputProps) => {
  const validateYoutubeUrl = (url: string): boolean => {
    if (!url) return true; // Si está vacío, permitimos continuar (no obligatorio)
    return youtubeRegex.test(url);
  };

  useEffect(() => {
    onValidationChange(validateYoutubeUrl(value));
  }, [value, onValidationChange]);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>URL del Video (YouTube)</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className={hasError ? "border-red-500 pr-10" : ""}
        />
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-sm text-red-500">URL inválida. Utiliza un enlace de YouTube</p>
      )}
    </div>
  );
};
