import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import "./App.css";

const ydoc = new Y.Doc();
const provider = new WebsocketProvider("ws://localhost:1234", "room-code-sync", ydoc);
const yText = ydoc.getText("monaco");

function CollaborativeEditor() {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const decorationsRef = useRef(new Map());
  const selectionDecorationsRef = useRef(new Map());
  
  const userName = "User" + Math.floor(Math.random() * 10000);
  const userColor = "#" + Math.floor(Math.random() * 16777215).toString(16);

  useEffect(() => {
    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
    });
    window.provider = provider;
    window.ydoc = ydoc;
    // Clean up awareness on tab close
    const cleanup = () => {
      provider.awareness.setLocalState(null);
      provider.disconnect && provider.disconnect();
    };
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );

    const updateCursor = () => {
      const position = editor.getPosition();
      if (position) {
        provider.awareness.setLocalStateField("cursor", {
          line: position.lineNumber,
          column: position.column,
        });
      }
    };
    editor.onDidChangeCursorPosition(updateCursor);
    updateCursor();
    setupRemoteCursors(editor, monaco);

    // --- MOUSE CURSOR TRACKING ---
    const editorDom = editor.getDomNode();
    let lastMouse = null;
    const handleMouseMove = (e) => {
      if (!editorDom) return;
      const rect = editorDom.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newMouse = { x, y };
      if (!lastMouse || lastMouse.x !== x || lastMouse.y !== y) {
        provider.awareness.setLocalStateField('mouse', newMouse);
        lastMouse = newMouse;
      }
    };
    if (editorDom) editorDom.addEventListener('mousemove', handleMouseMove);
    setupRemoteMousePointers(editor);
    // Cleanup
    return () => {
      if (editorDom) editorDom.removeEventListener('mousemove', handleMouseMove);
    };
  };

  // --- REMOTE CURSOR FLAGS ---
  const setupRemoteCursors = (editor, monaco) => {
    const decorations = decorationsRef.current;

    const renderCursors = () => {
      const states = Array.from(provider.awareness.getStates().entries());

      for (const [clientID, oldDecorations] of decorations.entries()) {
        if (oldDecorations && oldDecorations.length > 0) {
          editor.deltaDecorations(oldDecorations, []);
        }
      }
      decorations.clear();

      for (const [clientID, state] of states) {
        if (clientID === provider.awareness.clientID) continue;

        const { cursor, user } = state || {};
        if (!cursor || !user || !cursor.line || !cursor.column) continue;

        const range = new monaco.Range(
          cursor.line,
          cursor.column,
          cursor.line,
          cursor.column
        );

        const className = `remote-cursor-${clientID}`;

        const decoration = {
          range,
          options: {
            className: `remote-cursor ${className}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            hoverMessage: { value: `${user.name}'s cursor` },
          },
        };

        const newDecorations = editor.deltaDecorations([], [decoration]);
        decorations.set(clientID, newDecorations);

        createCursorStyle(className, user.color);
      }
    };

    provider.awareness.on("change", renderCursors);
    renderCursors();

    return () => {
      provider.awareness.off("change", renderCursors);
      for (const [clientID, oldDecorations] of decorations.entries()) {
        if (oldDecorations.length > 0) {
          editor.deltaDecorations(oldDecorations, []);
        }
      }
      decorations.clear();
    };
  };

  // --- REMOTE CURSOR STYLE ---
  const createCursorStyle = (className, color) => {
    const styleId = `style-${className}`;
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .monaco-editor .${className}::before {
        content: "";
        position: absolute;
        left: -1px;
        top: 0;
        width: 2px;
        height: 100%;
        background-color: ${color};
        z-index: 10;
        pointer-events: none;
      }
      .monaco-editor .${className}::after {
        content: "";
        position: absolute;
        left: -4px;
        top: -2px;
        width: 8px;
        height: 4px;
        background-color: ${color};
        z-index: 11;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  };

  // Remove setupRemoteCursorsAndSelections and related decoration logic
  // Only keep mouse pointer rendering
  const setupRemoteMousePointers = (editor) => {
    const mousePointers = new Map();
    const renderMousePointers = () => {
      const states = Array.from(provider.awareness.getStates().entries());
      // Remove all mouse pointers
      for (const [clientID, el] of mousePointers.entries()) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }
      mousePointers.clear();
      // Add new mouse pointers for each remote user
      for (const [clientID, state] of states) {
        if (clientID === provider.awareness.clientID) continue;
        const { user, mouse } = state || {};
        if (user && user.color && mouse && typeof mouse.x === 'number' && typeof mouse.y === 'number') {
          let pointerEl = document.createElement('div');
          pointerEl.className = 'remote-mouse-pointer';
          pointerEl.style.position = 'absolute';
          pointerEl.style.left = mouse.x + 'px';
          pointerEl.style.top = mouse.y + 'px';
          pointerEl.style.pointerEvents = 'none';
          pointerEl.style.zIndex = 100;
          pointerEl.style.background = 'none';
          pointerEl.innerHTML = `<svg width="18" height="24" style="display:block"><polygon points="0,0 18,12 8,14 12,24 0,0" fill="${user.color}" /></svg><div style="font-size:10px;color:${user.color};font-weight:bold;">${user.name}</div>`;
          // Attach to editor DOM node
          const editorDom = editor.getDomNode();
          if (editorDom) editorDom.appendChild(pointerEl);
          mousePointers.set(clientID, pointerEl);
        }
      }
    };
    provider.awareness.on('change', renderMousePointers);
    renderMousePointers();
    // Cleanup
    return () => {
      provider.awareness.off('change', renderMousePointers);
      for (const [clientID, el] of mousePointers.entries()) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }
      mousePointers.clear();
    };
  };

  // --- REMOTE SELECTION HIGHLIGHTING (CLEAN) ---
  // Broadcast local selection to awareness
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    let lastSelection = null;
    const updateSelection = () => {
      const selection = editor.getSelection();
      if (selection) {
        const newSelection = {
          start: { line: selection.selectionStartLineNumber, column: selection.selectionStartColumn },
          end: { line: selection.endLineNumber, column: selection.endColumn }
        };
        if (
          !lastSelection ||
          lastSelection.start.line !== newSelection.start.line ||
          lastSelection.start.column !== newSelection.start.column ||
          lastSelection.end.line !== newSelection.end.line ||
          lastSelection.end.column !== newSelection.end.column
        ) {
          provider.awareness.setLocalStateField('selection', newSelection);
          lastSelection = newSelection;
        }
      }
    };
    editor.onDidChangeCursorSelection(updateSelection);
    updateSelection();
    return () => {};
  }, [editorRef]);

  // Render remote selections for other users
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const selectionDecorations = selectionDecorationsRef.current;

    const renderSelections = () => {
      const states = Array.from(provider.awareness.getStates().entries());
      // Clear all existing selection decorations
      for (const [clientID, oldDecorations] of selectionDecorations.entries()) {
        if (oldDecorations && oldDecorations.length > 0) {
          editor.deltaDecorations(oldDecorations, []);
        }
      }
      selectionDecorations.clear();
      // Add new decorations for each remote selection
      for (const [clientID, state] of states) {
        if (clientID === provider.awareness.clientID) continue;
        const { selection, user } = state || {};
        if (!selection || !user || !selection.start || !selection.end) continue;
        // Guard: skip if range is invalid
        if (
          typeof selection.start.line !== 'number' ||
          typeof selection.start.column !== 'number' ||
          typeof selection.end.line !== 'number' ||
          typeof selection.end.column !== 'number'
        ) continue;
        // Guard: skip if out of bounds
        const model = editor.getModel();
        const maxLine = model.getLineCount();
        if (
          selection.start.line < 1 || selection.start.line > maxLine ||
          selection.end.line < 1 || selection.end.line > maxLine
        ) continue;
        const range = new monaco.Range(
          selection.start.line,
          selection.start.column,
          selection.end.line,
          selection.end.column
        );
        const className = `remote-selection-${clientID}`;
        const decoration = {
          range,
          options: {
            className: `remote-selection ${className}`,
            isWholeLine: false,
            inlineClassName: className,
          },
        };
        const newDecorations = editor.deltaDecorations([], [decoration]);
        selectionDecorations.set(clientID, newDecorations);
        // Style
        const styleId = `style-${className}`;
        const existing = document.getElementById(styleId);
        if (existing) existing.remove();
        const style = document.createElement("style");
        style.id = styleId;
        style.innerHTML = `
          .monaco-editor .${className} {
            background-color: ${user.color}33 !important;
            border-radius: 2px;
          }
        `;
        document.head.appendChild(style);
      }
    };

    provider.awareness.on('change', renderSelections);
    renderSelections();

    return () => {
      provider.awareness.off('change', renderSelections);
      for (const [clientID, oldDecorations] of selectionDecorations.entries()) {
        if (oldDecorations && oldDecorations.length > 0) {
          editor.deltaDecorations(oldDecorations, []);
        }
      }
      selectionDecorations.clear();
    };
  }, [editorRef, monacoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      
      // Clean up any remaining styles
      const styles = document.querySelectorAll('[id^="style-remote-cursor-"]');
      styles.forEach(style => style.remove());
    };
  }, []);

  return (
    <Editor
      height="90vh"
      defaultLanguage="javascript"
      defaultValue="// Start coding collaboratively!"
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: "on",
      }}
    />
  );
}

export default CollaborativeEditor;
export { provider };