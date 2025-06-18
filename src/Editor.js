import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";

const ydoc = new Y.Doc();
const provider = new WebsocketProvider("wss://demos.yjs.dev", "room-code-sync", ydoc);
const yText = ydoc.getText("monaco");

function CollaborativeEditor() {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
  };

  const userName = "RockJason";
  const userColor = "#" + Math.floor(Math.random()*16777215).toString(16);

  provider.awareness.setLocalStateField("user",{
    name: userName,
    color: userColor
  });
  provider.awareness.on("change", () => {
    console.log("Someone connected/disconnected");
  });
  useEffect(() => {
    console.log("Current awareness states:", Array.from(provider.awareness.getStates().values()));
  },[]);

  return (
    <Editor
      height="90vh"
      defaultLanguage="javascript"
      defaultValue="// Start coding"
      onMount={handleEditorDidMount}
    />
  );
}

export default CollaborativeEditor;
export {provider};
