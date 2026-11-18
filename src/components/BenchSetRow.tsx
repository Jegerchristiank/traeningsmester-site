import { useState } from "react";
import { setError, type BenchRow } from "../benchSession";

type Props = {
  row: BenchRow;
  index: number;
  active: boolean;
  revealErrors: boolean;
  ready: boolean;
  edit: (index: number, field: "weight" | "reps", value: string) => void;
  save: (index: number) => boolean;
  uncheck: (index: number) => boolean;
  announce: (message: string) => void;
};

export default function BenchSetRow({
  row,
  index,
  active,
  ready,
  revealErrors,
  edit,
  save,
  uncheck,
  announce,
}: Props) {
  const [attempted, setAttempted] = useState(false);
  const number = index + 1;
  const error = attempted || (revealErrors && row.saved) ? setError(row) : null;
  const errorId = `bench-row-error-${number}`;
  const state = row.saved ? "saved" : active ? "current" : "planned";

  function flushSaved() {
    if (row.saved && !save(index)) setAttempted(true);
  }

  function complete() {
    if (row.saved) {
      if (uncheck(index))
        announce(`Sæt ${number} er ikke længere markeret som udført.`);
      return;
    }
    setAttempted(true);
    if (save(index)) announce(`Sæt ${number} er registreret.`);
  }

  function step(delta: number) {
    const current = Number(row.reps);
    const value = Number.isInteger(current) && current > 0 ? current : 0;
    edit(index, "reps", String(Math.max(1, value + delta)));
  }

  return (
    <li className="bench-row" data-state={state}>
      <div className="bench-row-grid">
        <span className="bench-number" aria-label={`Sæt ${number}`}>
          {number}
        </span>
        <div className="bench-stepper">
          <button
            type="button"
            aria-label={`Træk én gentagelse fra sæt ${number}`}
            disabled={!ready || Number(row.reps) === 1}
            onClick={() => step(-1)}
          >
            −
          </button>
          <input
            aria-label={`Gentagelser for sæt ${number}`}
            inputMode="numeric"
            autoComplete="off"
            value={row.reps}
            disabled={!ready}
            aria-invalid={error?.includes("gentagelser") || undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => edit(index, "reps", event.target.value)}
            onBlur={flushSaved}
          />
          <button
            type="button"
            aria-label={`Tilføj én gentagelse i sæt ${number}`}
            disabled={!ready}
            onClick={() => step(1)}
          >
            +
          </button>
        </div>
        <input
          className="bench-weight"
          aria-label={`Vægt for sæt ${number}`}
          inputMode="decimal"
          autoComplete="off"
          value={row.weight}
          disabled={!ready}
          aria-invalid={error?.includes("vægt") || undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => edit(index, "weight", event.target.value)}
          onBlur={flushSaved}
        />
        <button
          type="button"
          className="bench-mark"
          aria-label={
            row.saved
              ? `Fjern udført for sæt ${number}`
              : `Marker sæt ${number} som udført`
          }
          aria-pressed={Boolean(row.saved)}
          disabled={!ready}
          onClick={complete}
        >
          <span className="bench-ring" aria-hidden="true">
            {row.saved ? "✓" : ""}
          </span>
        </button>
      </div>
      {error && (
        <p id={errorId} className="bench-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
