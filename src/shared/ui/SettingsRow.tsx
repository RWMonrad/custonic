"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@radix-ui/react-switch";
import { useState } from "react";
import { Button } from "./Button";

interface SettingsRowProps {
  title: string;
  description?: string;
  type: "toggle" | "button" | "input";
  value?: boolean | string;
  onValueChange?: (value: boolean | string) => void;
  buttonText?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function SettingsRow({
  title,
  description,
  type,
  value,
  onValueChange,
  buttonText,
  placeholder,
  disabled = false,
}: SettingsRowProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || "");

  const handleToggle = (checked: boolean) => {
    onValueChange?.(checked);
  };

  const handleButtonClick = () => {
    onValueChange?.(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border",
        disabled && "opacity-50",
      )}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="ml-4">
        {type === "toggle" && (
          <Switch
            checked={value as boolean}
            onCheckedChange={handleToggle}
            disabled={disabled}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              (value as boolean) ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                (value as boolean) ? "translate-x-6" : "translate-x-1",
              )}
            />
          </Switch>
        )}

        {type === "button" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={disabled}
          >
            {buttonText}
          </Button>
        )}

        {type === "input" && (
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          />
        )}
      </div>
    </div>
  );
}
