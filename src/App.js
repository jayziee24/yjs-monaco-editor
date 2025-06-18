import React from "react";
import CollaborativeEditor from "./Editor";
import {provider} from "./Editor";
import Users from "./Users";
function App() {
  return (
    <div>
      <h2 style={{ textAlign: "center" }}>🧠 Yjs + Monaco Code Editor</h2>
      <Users awareness={provider.awareness} />
      <CollaborativeEditor />
    </div>
  );
}

export default App;
