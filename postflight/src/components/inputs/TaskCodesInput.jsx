import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function TaskCodesInput({ value = [], onChange, disabled = false }) {
  const [draft, setDraft] = useState("");

  const addCodes = (text) => {
    if (!text) return;
    const parts = text.
    split(/[,\s]+/).
    map((p) => p.trim()).
    filter(Boolean);

    const next = new Set(value);
    parts.forEach((p) => {
      const code = p.toUpperCase();
      if (/^[A-Z0-9]{4}$/.test(code)) {
        next.add(code);
      }
    });
    onChange?.(Array.from(next));
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCodes(draft);
    }
    if (e.key === "Backspace" && draft === "" && value.length > 0) {
      // quick remove last
      onChange?.(value.slice(0, -1));
    }
  };

  const removeCode = (code) => {
    onChange?.(value.filter((c) => c !== code));
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (text) {
      e.preventDefault();
      addCodes(text);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Task</Label>
      <div className="flex flex-wrap gap-2">
        {value.map((code) =>
        <Badge key={code} className="bg-secondary/10 text-secondary flex items-center gap-1">
            {code}
            {!disabled &&
          <button
            type="button"
            onClick={() => removeCode(code)}
            className="ml-1 hover:opacity-80"
            aria-label={`Remove ${code}`}>

                <X className="w-3 h-3" />
              </button>
          }
          </Badge>
        )}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="Enter 4-char codes (comma or Enter)"
        disabled={disabled} />

      <p className="text-xs text-muted-foreground">Enter ATM task number to track your training iterations.(optional)

      </p>
    </div>);

}