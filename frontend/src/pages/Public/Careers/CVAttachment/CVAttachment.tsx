import { useRef, useState, type DragEvent } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import {
  cvMetadataError,
  cvSignatureError,
} from "../../../../../../shared/src/careers";
import "./CVAttachment.css";
export function CVAttachment({
  file,
  onChange,
  error,
  setError,
  disabled,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  setError: (error: string) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null),
    sequence = useRef(0);
  const [dragging, setDragging] = useState(false),
    [checking, setChecking] = useState(false);
  async function choose(next?: File) {
    const token = ++sequence.current;
    if (!next || disabled) return;
    setChecking(true);
    setError("Please wait for the document check to finish.");
    let issue = cvMetadataError(next.name, next.size);
    if (!issue)
      try {
        issue = cvSignatureError(
          next.name,
          new Uint8Array(await next.arrayBuffer()),
        );
      } catch {
        issue = "This file could not be read. Choose it again.";
      }
    if (token !== sequence.current) return;
    setChecking(false);
    if (issue) setError(issue);
    else {
      setError("");
      onChange(next);
    }
  }
  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (event.dataTransfer.files.length !== 1) {
      setError("Choose one CV at a time.");
      return;
    }
    void choose(event.dataTransfer.files[0]);
  }
  return (
    <div className="career-cv-field">
      <div
        className={`career-cv ${dragging ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
      >
        <Paperclip size={18} strokeWidth={1.5} aria-hidden="true" />
        <div className="career-cv-copy">
          <span>
            Attach your CV <small>(optional)</small>
          </span>
          <p>PDF or DOCX, up to 5 MB</p>
        </div>
        <button
          type="button"
          disabled={disabled || checking}
          id="career-cv"
          onClick={() => input.current?.click()}
        >
          {checking ? "Checking…" : file ? "Replace file" : "Choose file"}
        </button>
        <input
          ref={input}
          id="career-cv-input"
          tabIndex={-1}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-label="Choose CV"
          aria-describedby={error ? "career-cv-error" : undefined}
          disabled={disabled || checking}
          onChange={(event) => {
            void choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      {file && (
        <div className="career-file-chip" role="status">
          <FileText size={16} aria-hidden="true" />
          <span title={file.name}>
            {file.name}
            <small>
              {file.size < 1024 * 1024
                ? `${Math.ceil(file.size / 1024)} KB`
                : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
            </small>
          </span>
          <button
            type="button"
            className="pub-icon"
            aria-label="Remove CV"
            disabled={disabled}
            onClick={() => {
              sequence.current++;
              setChecking(false);
              onChange(null);
              setError("");
            }}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
      {checking && (
        <span role="status" className="career-field-error">
          Checking document format…
        </span>
      )}
      {error && (
        <span id="career-cv-error" role="alert" className="career-field-error">
          {error}
        </span>
      )}
    </div>
  );
}
