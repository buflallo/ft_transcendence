import '../styles/css/main.css'
import LoadingComponent from './LoadingComponent'; // Import the loading component
import { useEffect, useState } from 'react';


export default function Sbox(props: any) {
    const [users, setUsers] = useState([]);
    const [Players, setPlayers] = useState(false);

    const getPlayers = async () => {
        try {
          const response = await fetch('http://localhost:3000/profile/all', {
            credentials: "include",
            method: "GET",
          });
          const data = await response.json(); // Parse the response as JSON
          setUsers(data.users); // Set the parsed data to state
        } catch (error) {
          console.error(error);
        }
      };
    useEffect(() => {
        console.log("users: ", users);
        if (users.length > 0) {
          console.log("showing users");
          setPlayers(true);
        }
      }, [users]);

    return (
        <>
            <main className="wrapper">
                {props.isLoading && <LoadingComponent />} {/* Render the loading component when isLoading is true */}
                {!props.isLoading && (
                    <div className="sbox">
                        {Players && (
                          <div className="players">
                            {users.map((user) => (
                                <div key={user.id_player} className="player">
                                <img src={user.avatar} alt="player" className="player__img" />
                                <h3 className="player__name">{user.username}</h3>
                                <button onClick={()=> props.handleFriendClick(user.id_player)} className="player__button">Button Text</button>
                                </div>
                            ))}
                          </div>
                        )}
                        {!Players && (
                          <div className="sbox__title">
                              <h1 className="btitle">{props.btitle}</h1>
                              <h3 className="stitle">{props.stitle}</h3>
                          </div>
                        )}
                          <div className="sbox__btn">
                              <button className="trans bt" onClick={()=> props.handleMatchClick()}>
                                  {props.rb}
                              </button>
                              <button className="filled bt" onClick={getPlayers}>{props.lb}</button>
                          </div>
                    </div>
                )}
            </main>
        </>
    );
}