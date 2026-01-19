"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

export default function DebugFilePickerPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [lastEvent, setLastEvent] = useState<string>("none");
  const [lastName, setLastName] = useState<string | null>(null);
  const [lastValue, setLastValue] = useState<string | null>(null);

  const derived = useMemo(() => {
    const el = inputRef.current;
    const f = el?.files?.[0];
    return {
      fileName: f?.name ?? null,
      fileSize: f?.size ?? null,
      fileType: f?.type ?? null,
      value: el?.value ?? null,
    };
  }, [lastEvent, lastName, lastValue]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      <h1 className="text-2xl font-bold">Debug: File picker</h1>
      <p className="text-sm text-gray-600">
        This page exists to validate whether file input events are firing in your browser environment.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <input
          ref={inputRef}
          type="file"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          onClick={() => setLastEvent("click")}
          onInput={(e: FormEvent<HTMLInputElement>) => {
            const f = (e.currentTarget as HTMLInputElement).files?.[0];
            setLastEvent("input");
            setLastName(f?.name ?? null);
            setLastValue((e.currentTarget as HTMLInputElement).value ?? null);
          }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const f = e.currentTarget.files?.[0];
            setLastEvent("change");
            setLastName(f?.name ?? null);
            setLastValue(e.currentTarget.value ?? null);
          }}
        />

        <button
          type="button"
          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={() => inputRef.current?.click()}
        >
          Trigger picker via JS
        </button>

        <div className="text-sm text-gray-800 space-y-1">
          <div>
            <span className="font-semibold">Last event:</span> {lastEvent}
          </div>
          <div>
            <span className="font-semibold">State name:</span> {lastName ?? "(none)"}
          </div>
          <div>
            <span className="font-semibold">State value:</span> {lastValue ?? "(none)"}
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div>
              <span className="font-semibold">DOM files[0].name:</span> {derived.fileName ?? "(none)"}
            </div>
            <div>
              <span className="font-semibold">DOM files[0].type:</span> {derived.fileType ?? "(none)"}
            </div>
            <div>
              <span className="font-semibold">DOM files[0].size:</span> {derived.fileSize ?? "(none)"}
            </div>
            <div>
              <span className="font-semibold">DOM input.value:</span> {derived.value ?? "(none)"}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">debug-file-picker-v1</p>
    </div>
  );
}
