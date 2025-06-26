import React,{useEffect,useState} from "react";
function Users({awareness}) {
    const [users,setUsers] = useState([]);
    useEffect(() => {
        const onChange = () => {
            const states = Array.from(awareness.getStates().values());
            // Filter out duplicate users by name and color, and exclude 'RockJason'
            const seen = new Set();
            const uniqueUsers = [];
            for (const state of states) {
                if (state.user && state.user.name !== 'RockJason') {
                    const key = state.user.name + '-' + state.user.color;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueUsers.push(state.user);
                    }
                }
            }
            setUsers(uniqueUsers);
        }

        awareness.on("change",onChange);
        onChange();
        return () => {
            awareness.off("change",onChange);
        };
    },[awareness]);

    

    return (
        <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
            {users.map((user,idx) => (
                <div key={idx} style={{color:user.color,fontWeight:"bold"}}>
                    {user.name}
                </div>
            ))}
        </div>
    );
}

export default Users;