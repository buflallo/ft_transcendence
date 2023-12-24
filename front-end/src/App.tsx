import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Login } from "./Login.tsx";
import { Config } from "./Config.tsx";
import './styles/css/App.css';
import { TwoFA } from './TwoFA.tsx';
import { Verify2FA } from './Verify2FA.tsx';
import { Play } from './Play.tsx';
import { Chat } from './Chat.tsx';
import { Settings } from './Settings.tsx'
import { Leaderboard } from './Leaderboard.tsx'
import { Profile } from './Profile.tsx'
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Navbar from './Components/Navbar.tsx';
import { UserContext } from './UserProvider.tsx';
import AuthGuard from './guards/AuthGuard.tsx';
import UnAuthGuard from './guards/UnAuthGuard.tsx';
import { useMediaPredicate } from 'react-media-hook';
import {inviteStatus} from './Components/types.ts'
import { TestChat } from './Testchat.tsx';
import axios from 'axios';


function App()
{
    const location = useLocation();
    
        const navigate = useNavigate();
        const [invite, setInvite] = useState<inviteStatus>(inviteStatus.NONE);
        const [inviters, setInviters] = useState<{user_id: string, username: string}[]>([]);
        const [isnotified, setisnotified] = useState(true);
        const [inPlay, setInPlay] = useState(false);
        const { user, initialize,  socket } = useContext(UserContext);
        
            const checkIfMediumPlus = useMediaPredicate(
                '(min-width: 769px)'
              );
        const inviteResp = async (resp: Boolean, inviter: any) => {
            if (socket)
            {
                socket.emit('inviteResp', {
                accepted: resp,
                userId: inviter?.user_id.toString(),
                adv_id: user?.id_player.toString(),
                username: user?.username,
                }, async (response: any) => {
                console.log('Received acknowledgement from server:', response);
                if (!response) {
                    console.log('error');
                    // setInvite(inviteStatus.ABORTED);
                    // setInviter(null);
                    return;
                }
                setInvite(inviteStatus.ACCEPTED);
                let gameId = await axios.get(`http://localhost:3000/game/${inviter.user_id}/getgame/SEARCHING`, { withCredentials: true });
                console.log('gameId: ', gameId);
                gameId = gameId.data.id_game;
                console.log('gameId: ', gameId);
                await axios.post(`http://localhost:3000/game/${gameId}/joinGame`, {userId: user?.id_player},  { withCredentials: true });
                await axios.post(`http://localhost:3000/game/${gameId}/updateGame`, {status: 'PLAYING'},  { withCredentials: true });
                });
            }
        };
    if (location.pathname != '/')
    {
        const isMounted = useRef(true); // useRef to track whether the component is mounted
        useEffect(() => {
            if (isMounted.current) {
            initialize();
            console.log('isMounted: ', isMounted.current);
            // socket.emit('playOpen', { id: socket.id });
            }
            return () => {
            isMounted.current = false;
            };
        } , []);
        
        const handleInvited = (data: any) => {
            if (inPlay)
                return;
            console.log("invited by ", data);
            setisnotified(true);
            setInviters(prevInviters => [...prevInviters, {user_id: data.user_id, username: data.username}]);
            setInvite(inviteStatus.INVITED);
        };
        const handleRmInvite = (data: any) => {
            setInviters(prevInviters => prevInviters.filter((inviter) => inviter.user_id !== data));
            console.log("invite removed ", data);
        };
        useEffect(() => {
            // Listen for 'invited' event
            if (socket)
            {
                console.log('listening socket: invited');
                socket.emit('getNotifs', {userId: user?.id_player.toString()}, (response: any) => {
                    console.log('Received acknowledgement from server:', response);
                    if (response.length > 0) {
                        // use user_id and username from response to setInviters
                        setInviters(response);
                        setInvite(inviteStatus.INVITED);
                        setisnotified(true);
                    }
                    else
                        setisnotified(false);
                });
                socket.on('invited', (data: any) => handleInvited(data));
                socket.on('rminvite', (data: any) => handleRmInvite(data));
            }
            else
                console.log('no socket');
            // Clean up the event listener on unmount
            return () => {
                socket?.off('invited', handleInvited);
                socket?.off('rminvite', handleRmInvite);
            };
        }, [socket]);
    }

    return (
        <div className={`container ` + (checkIfMediumPlus ? "default" : "one")}>
        <Routes>
            <Route key='Login' path='/' element={<UnAuthGuard component={<Login />}  />}>
                {' '}
            </Route>
            {/* <Route key='Login' path='*' element={<UnAuthGuard component={<Navigate to='/' />}  />}>
                {' '}
            </Route> */}
            <Route
            key='AuthRoutes'
            path='/*'
            element={
                <AuthGuard
                    component={
                    <>
                        <Navbar />
                        <div className="invite sbox">
                        {isnotified && invite === inviteStatus.INVITED && inviters.map((inviter) => ( (
                            <div key={inviter.user_id} className="invite">
                                <div className="sbox__title">
                                    <h1 className="btitle">{inviter.username} {inviter.user_id}</h1>
                                    <h3 className="stitle">invited you to play</h3>
                                </div>
                                <div className="sbox__btn">
                                    <button className="trans bt" onClick={()=> {inviteResp(true, inviter); navigate('/Play')}}>Accept</button>
                                    <button className="filled bt" onClick={()=> inviteResp(false, inviter)}>decline</button>
                                </div>
                            </div>
                                )))}
                        </div>
                        <Routes>
                        <Route key='Config' path='/Config' caseSensitive={true} element={<Config />} />
                        <Route key='TwoFA' path='/TwoFA' caseSensitive={true} element={<TwoFA />} />
                        <Route key='testchat' path='/Testchat' caseSensitive={true} element={<TestChat />} />
                        <Route key='Verify2FA' path='/Verify2FA' caseSensitive={true} element={<Verify2FA />} />
                        <Route key='Profile' path='/Profile' caseSensitive={true} element={<Profile />} />
                        <Route key='Play' path='/Play' caseSensitive={true} element={<Play setInPlay={setInPlay} inviter={inviters} />} />
                        <Route key='Chat' path='/Chat' caseSensitive={true} element={<Chat />} />
                        <Route key='Settings' path='/Settings' caseSensitive={true} element={<Settings />} />
                        <Route key='Leaderboard' path='/Leaderboard' caseSensitive={true} element={<Leaderboard />} />
                        <Route path='*' element={<Navigate to='/Profile' />} />
                        </Routes>
                    </>
                    }
                />
            }
            />
      </Routes>
    </div>
    );
}

export default App;