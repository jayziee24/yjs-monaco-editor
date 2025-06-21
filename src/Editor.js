import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import "./App.css";

const ydoc = new Y.Doc();
const provider = new WebsocketProvider("wss://demos.yjs.dev", "room-code-sync", ydoc);
const yText = ydoc.getText("monaco");

function CollaborativeEditor() {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const decorationsRef = useRef(new Map());
  
  const userName = "RockJason";
  const userColor = "#" + Math.floor(Math.random() * 16777215).toString(16);

  useEffect(() => {
    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
    });
    
    // Debug helpers
    window.provider = provider;
    window.ydoc = ydoc;
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Create Monaco binding
    bindingRef.current = new MonacoBinding(
      yText, 
      editor.getModel(), 
      new Set([editor]), 
      provider.awareness
    );
    
    // Set up cursor position tracking
    const updateCursor = () => {
      const position = editor.getPosition();
      if (position) {
        provider.awareness.setLocalStateField("cursor", {
          line: position.lineNumber,
          column: position.column,
        });
      }
    };

    // Track cursor changes
    editor.onDidChangeCursorPosition(updateCursor);
    updateCursor(); // Set initial position
    
    // Set up remote cursor rendering
    setupRemoteCursors(editor, monaco);
  };

  const setupRemoteCursors = (editor, monaco) => {
    const decorations = decorationsRef.current;
    
    const renderCursors = () => {
      const states = Array.from(provider.awareness.getStates().entries());
      
      // Clear all existing decorations first
      for (const [clientID, oldDecorations] of decorations.entries()) {
        if (oldDecorations && oldDecorations.length > 0) {
          editor.deltaDecorations(oldDecorations, []);
        }
      }
      decorations.clear();
      
      // Add new decorations for each remote cursor
      for (const [clientID, state] of states) {
        // Skip our own cursor
        if (clientID === provider.awareness.clientID) continue;
        
        const { cursor, user } = state;
        if (!cursor || !user || !cursor.line || !cursor.column) continue;
        
        try {
          // Create range for cursor position
          const range = new monaco.Range(
            cursor.line, 
            cursor.column, 
            cursor.line, 
            cursor.column
          );
          
          const className = `remote-cursor-${clientID}`;
          
          // Create decoration
          const decoration = {
            range,
            options: {
              className: "remote-cursor",
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              hoverMessage: { value: `${user.name}'s cursor` },
            },
          };
          
          // Apply decoration
          const newDecorations = editor.deltaDecorations([], [decoration]);
          decorations.set(clientID, newDecorations);
          
          // Create dynamic CSS for this cursor
          createCursorStyle(className, user.color);
          
        } catch (error) {
          console.warn("Error creating cursor decoration:", error);
        }
      }
    };

    // Listen for awareness changes
    provider.awareness.on("change", renderCursors);
    
    // Initial render
    renderCursors();
    
    // Cleanup function
    return () => {
      provider.awareness.off("change", renderCursors);
      
      // Clear all decorations
      for (const [clientID, oldDecorations] of decorations.entries()) {
        if (oldDecorations && oldDecorations.length > 0) {
          editor.deltaDecorations(oldDecorations, []);
        }
      }
      decorations.clear();
    };
  };

  const createCursorStyle = (className, color) => {
    // Remove existing style if it exists
    const existingStyle = document.getElementById(`style-${className}`);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create new style
    const style = document.createElement("style");
    style.id = `style-${className}`;
    style.innerHTML = `
      .monaco-editor .remote-cursor {
        position: relative;
      }
      .monaco-editor .remote-cursor::before {
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
      .monaco-editor .remote-cursor::after {
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