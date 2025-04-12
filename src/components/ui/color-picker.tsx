
import React from "react";
import { HexColorInput, HexColorPicker as ReactColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ 
  color, 
  onChange,
  className,
  ...props 
}: ColorPickerProps) {
  return (
    <div className={cn("color-picker", className)} {...props}>
      <ReactColorPicker color={color} onChange={onChange} />
    </div>
  );
}

export interface ColorInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  color: string;
  onChange: (color: string) => void;
  prefixed?: boolean;
  alpha?: boolean;
}

export function ColorInput({
  color,
  onChange,
  prefixed = false,
  alpha = false,
  className,
  ...props
}: ColorInputProps) {
  return (
    <HexColorInput
      color={color}
      onChange={onChange}
      prefixed={prefixed}
      alpha={alpha}
      className={cn("w-full rounded-md border border-input bg-background px-3 py-2 text-sm", className)}
      {...props}
    />
  );
}
