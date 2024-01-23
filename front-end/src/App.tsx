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
import { UserContext, UserProvider } from './UserProvider.tsx';
import AuthGuard from './guards/AuthGuard.tsx';
import UnAuthGuard from './guards/UnAuthGuard.tsx';
import { useMediaPredicate, useMedia } from 'react-media-hook';
import {inviteStatus, user} from './Components/types.ts'
import { TestChat } from './Testchat.tsx';
import axios from 'axios';
import { History } from './Components/types.ts';
import { ToastProvider } from 'react-toast-notifications';
import ButtonsComponent from './ButtonsComponent.tsx';

interface inviters
{
    user_id: string,
     username: string,
     gameId: number,
}

enum NotifType {
    MESSAGE = 'MESSAGE',
    INVITE = 'INVITE',
    GAME = 'GAME',
    BLOCKED = 'BLOCKED',
    ACCEPTED = 'ACCEPTED',
  }

function App()
{
    const location = useLocation();
    
    const [invite, setInvite] = useState<inviteStatus>(inviteStatus.NONE);
    const [inviters, setInviters] = useState<{user_id:string, avatar: string, username: string, type: NotifType}[]>([]);
    const [inPlay, setInPlay] = useState(false);
    const [profile, setProfile] = useState<user | null>(null);
    const [history, setHistory] = useState<History[] | null>(null);
    const { user, initialize,  socket } = useContext(UserContext);
    const [inviter, setInviter] = useState<number | null>(null);

    const checkIfMediumPlus = useMediaPredicate(
        '(min-width: 994px)'
        );
        // navbar sizes
        // ```
        // 1200 ==>  20%
        // 994 - 1200 ==> 225px
        // 0 - 994 ==> 0px
        // ```
        
    const [isMediumPlus, isMedium, isSmall] = [useMediaPredicate('(min-width: 1200px)'), useMediaPredicate('(min-width: 994px)'), useMediaPredicate('(min-width: 0px)')]
    
    const inviteResp = async (resp: Boolean, inviter: any) => {
        // if (componentRef)
        // {
            console.log('componentRef: ', width);
            // console.log('componentRef.current: ', componentRef.current);
            // componentRef.current?.scrollIntoView({ behavior: 'smooth' });
        // }
        if (socket && width)
        {
            socket.emit('inviteResp', {
                accepted: resp,
                userId: inviter?.user_id.toString(),
                adv_id: user?.id.toString(),
                avatar: user?.avatar,
                username: user?.username,
                gameId: inviter?.gameId,
                width: width > 750 ? width * 0.8 : width,
            }, async (response: any) => {
                // got players ratio
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
                await axios.post(`http://localhost:3000/game/${gameId}/joinGame`, {userId: user?.id},  { withCredentials: true });
                await axios.post(`http://localhost:3000/game/${gameId}/updateGame`, {status: 'PLAYING'},  { withCredentials: true });
            });
        }
    };
    
    const isMounted = useRef(true); // useRef to track whether the component is mounted
    const width = useMemo(() => {
        if (!isMounted.current) {
            console.log('isMediumPlus: ', isMediumPlus, ' isMedium: ', isMedium, ' isSmall: ', isSmall);
            if (isMediumPlus){
                console.log('kbira document.body.clientWidth: ', document.body.offsetWidth);
                return document.body.offsetWidth * 0.8;
            }
            else if (isMedium)
                return document.body.offsetWidth - 225;
            else if (isSmall)
            {
                console.log('sghir document.body.clientWidth: ', document.body.offsetWidth);
                return document.body.offsetWidth;
            }
            else
                return 0;
        }
    } , [isMediumPlus, isMedium, isSmall] );
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
    useEffect(() => {
        // Listen for 'invited' event
        if (socket)
        {
            console.log('listening socket: invited');
            socket.emit('getNotifs', {userId: user?.id.toString()}, (response: any) => {
                console.log('Received acknowledgement from server:', response);
                if (response.length > 0) {
                    // use user_id and username from response to setInviters
                    setInviters(response);
                    setInvite(inviteStatus.NONE);
                    console.log('response: ', response);
                }
            });
            socket.on('invited', (data: any) => handleInvited(data));
            socket.on('rminvite', (data: any) => handleRmInvite(data));
            socket.on('blocked', (data: any) => handleBlocked(data));
            socket.on('accepted', (data: any) => handleAccepted(data));
        }
        else
            console.log('no socket');
        // Clean up the event listener on unmount
        return () => {
            socket?.off('invited', handleInvited);
            socket?.off('rminvite', handleRmInvite);
            socket?.off('blocked', handleBlocked);
            socket?.off('accepted', handleAccepted);
        };
    }, [socket]);
    const handleInvited = (data: any) => {
        setInviters(prevInviters => [...prevInviters, {user_id: data.user_id, avatar: data.avatar, username: data.username, type: data.type, paddle: data.paddle}]);
        if (data.type === NotifType.INVITE)
        {
            setProfile((prevProfile: user | null) => {
                if (!prevProfile) {
                    return prevProfile;
                }
                return {
                    ...prevProfile,
                    friend: {
                        ...prevProfile.friend,
                        status: "PENDING",
                    },
                };
            });
        }
        if (inPlay)
            return;
        setInvite(inviteStatus.INVITED);
    };
    const handleBlocked = (data: any) => {
        setInviters(prevInviters => prevInviters.filter((inviter) => inviter.user_id !== data.user_id && inviter.type !== NotifType.INVITE));
        setInviters(prevInviters => [...prevInviters, {user_id: data.user_id, avatar: data.avatar, username: data.username, type: data.type, paddle: data.paddle}]);
        setProfile(null);
        if (data.type === NotifType.BLOCKED)
        {
            setProfile((prevProfile: user | null) => {
                if (!prevProfile) {
                    return prevProfile;
                }
                return {
                    ...prevProfile,
                    friend: {
                        ...prevProfile.friend,
                        status: "BLOCKED",
                    },
                };
            });
        }
        if (inPlay)
            return;
        setInvite(inviteStatus.INVITED);
    };

    const handleAccepted = (data: any) => {
        // filter out previous inviters with same user_id and type === NotifType.INVITE
        setInviters(prevInviters => prevInviters.filter((inviter) => inviter.user_id !== data.user_id && inviter.type !== NotifType.INVITE));
        setInviters(prevInviters => [...prevInviters, {user_id: data.user_id, avatar: data.avatar, username: data.username, type: data.type, paddle: data.paddle}]);
        if (data.type === NotifType.ACCEPTED)
        {
            setProfile((prevProfile: user | null) => {
                if (!prevProfile) {
                    return prevProfile;
                }
                return {
                    ...prevProfile,
                    friend: {
                        ...prevProfile.friend,
                        status: "ACCEPTED",
                    },
                };
            });
        }
        if (inPlay)
            return;
        setInvite(inviteStatus.INVITED);
    };
    const handleRmInvite = (data: any) => {
        console.log("invite removed ", data);
        console.log("inviters ", inviters);
        setInviters(prevInviters => prevInviters.filter((inviter) => inviter.user_id !== data));
    };
    const componentRef = useRef<HTMLDivElement>(null);
    const [boardWidth, setboardWidth] = useState<number | null>(null);

    return (
        
        <div className={`container ` + (checkIfMediumPlus ? "default" : "one")}>
        
        <Routes>
            <Route key='Login' path='/' element={<UnAuthGuard component={<Login />}  />}/>
            <Route key='Config' path='/Config' element={<UnAuthGuard component={<Config />}  />}/>
            <Route key='Verify2FA' path='/Verify2FA' caseSensitive={true} element={<UnAuthGuard component={<Verify2FA />} />} />

            {/* <Route key='Login' path='*' element={<UnAuthGuard component={<Navigate to='/' />}  />}>
                {' '}
            </Route> */}
            <Route
            key='AuthRoutes'
            path='/*'
            element={
                <AuthGuard
                    component={
                    <UserProvider>
                        <ToastProvider>
                        <>
                            {location.pathname != "/" && location.pathname != "/Config" && location.pathname != "/TwoFA" && location.pathname != "/Verify2FA" && 
                            (<Navbar profile={profile} setProfile={setProfile} setHistory={setHistory} invite={invite} inviters={inviters} inviteResp={inviteResp} setInvite={setInvite}/>)
                            }
                            {
                                <>
                                    <Routes>
                                    <Route key='testchat' path='/Testchat' caseSensitive={true} element={<TestChat />} />
                                    <Route key='Profile' path='/Profile' caseSensitive={true} element={<Profile setFriend={setProfile} freind={profile} fhistory={history} />} />
                                    <Route key='Play' path='/Play' caseSensitive={true} element={<Play setInPlay={setInPlay} inviter={inviter} setInviter={setInviter}/>} />
                                    <Route key='Chat' path='/Chat' caseSensitive={true} element={<Chat setProfile={setProfile} setHistory={setHistory} setInviter={setInviter}/>} />
                                    <Route key='Chat' path='/test' caseSensitive={true} element={<ButtonsComponent />} />
                                    <Route key='Settings' path='/Settings' caseSensitive={true} element={<Settings />} />
                                    <Route key='Leaderboard' path='/Leaderboard' caseSensitive={true} element={<Leaderboard />} />
                                    <Route path='*' element={<Navigate to='/Profile' />} />
                                    </Routes>
                                </>
                            }
                            
                        </>
                        </ToastProvider>
                    </UserProvider>
                    }
                />
            }
            />
        </Routes>
    </div>
    );
}

export default App;