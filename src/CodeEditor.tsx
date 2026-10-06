import { useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/basic-languages/html/html.contribution.js";
import "monaco-editor/esm/vs/basic-languages/css/css.contribution.js";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js";
import "monaco-editor/esm/vs/language/html/monaco.contribution.js";
import "monaco-editor/esm/vs/language/css/monaco.contribution.js";
import "monaco-editor/esm/vs/editor/contrib/find/browser/findController.js";
import "monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js";
import "monaco-editor/esm/vs/editor/contrib/snippet/browser/snippetController2.js";
import "monaco-editor/esm/vs/editor/browser/coreCommands.js";

import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker.js?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker.js?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker.js?worker";
self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    return label === "html"
      ? new HtmlWorker()
      : label === "css"
        ? new CssWorker()
        : new EditorWorker();
  },
};
loader.config({ monaco });
export default function CodeEditor({
  file,
  value,
  onChange,
  onSave,
  onReady,
}: {
  file: string;
  value: string;
  onChange: (s: string) => void;
  onSave: () => void;
  onReady: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}) {
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  return (
    <Editor
      height="100%"
      path={file}
      language={
        file.endsWith(".html")
          ? "html"
          : file.endsWith(".css")
            ? "css"
            : "markdown"
      }
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={(editor) => {
        onReady(editor);
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () =>
          saveRef.current(),
        );
      }}
      loading={<div className="editor-loading">Abriendo editor…</div>}
      options={{
        fontSize: 13,
        fontFamily: "Consolas, 'Courier New', monospace",
        lineHeight: 21,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "off",
        ariaLabel: `Editar ${file}`,
        padding: { top: 12 },
        fixedOverflowWidgets: true,
      }}
    />
  );
}
