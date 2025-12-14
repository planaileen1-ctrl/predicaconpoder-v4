"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function EditorSimple({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef<string>("");

  // Inicializar SOLO una vez
  useEffect(() => {
    if (ref.current && !lastValue.current) {
      ref.current.innerHTML = value || "";
      lastValue.current = value || "";
    }
  }, [value]);

  const exec = (cmd: string) => {
    document.execCommand(cmd);
    sync();
  };

  const sync = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastValue.current = html;
    onChange(html);
  };

  return (
    <div>
      {/* TOOLBAR */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="px-2 py-1 bg-neutral-800 rounded font-bold"
        >
          B
        </button>

        <button
          type="button"
          onClick={() => exec("underline")}
          className="px-2 py-1 bg-neutral-800 rounded underline"
        >
          U
        </button>

        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="px-2 py-1 bg-neutral-800 rounded"
        >
          •
        </button>
      </div>

      {/* EDITOR */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="w-full min-h-[140px] bg-neutral-800 p-4 rounded-xl outline-none"
        onBlur={sync}
      />
    </div>
  );
}
