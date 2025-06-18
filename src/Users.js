import React,{useEffect,useState} from "react";
function Users({awareness}) {
    const [users,setUsers] = useState([]);
    useEffect(() => {
        const onChange = () => {
            const states = Array.from(awareness.getStates().values());
            setUsers(states.map(state => state.user).filter(Boolean));
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