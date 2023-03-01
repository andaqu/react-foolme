import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import PropTypes from 'prop-types';
import Answerer from './Answerer';
import Asker from './Asker';
import Answers from './Answers/Answers';
import { useFirestoreQuery } from '../hooks';


const Game = ({ user, role, users, roles, setUsers, gameId = null} ) => {

    const db = firebase.firestore();
    
    const gamesRef = db.collection('games');

    const gameRef = gamesRef.doc(gameId);
    const roundsRef = gameRef.collection('rounds')

    const [isLoaded, setIsLoaded] = useState(false);
    const [isVoting, setIsVoting] = useState(false);
    const [isAsking, setIsAsking] = useState(false);

    const [quit, setQuit] = useState(false);

    const [gameOver, setGameOver] = useState(false);

    const [timeLeft, setTimeLeft] = useState(0);

    const [teamWon, setTeamWon] = useState("");

    const round = useFirestoreQuery(roundsRef.orderBy('createdAt', 'desc').limit(1))[0];
    
    const gameQuery = useFirestoreQuery(gamesRef
        .where(firebase.firestore.FieldPath.documentId(), '==', gameId))[0];

    const [suspectedAI, setSuspectedAI] = useState("");

    // If user refreshes page or navigates away, call and await leaveGame async function
    useEffect(() => {
        window.addEventListener('beforeunload', leaveGame);
        return () => {
            window.removeEventListener('beforeunload', leaveGame);
        }
    }, []);
    

    // Always get the latest round in roundsRef
    useEffect(() => {
        
        if (round && users) {
            setIsLoaded(true);
        }
        
    }, [round, users]);

    // Print out the name and date-time of someone leaving the game. If the user has a date-time in abandonedAt, they have left the game.
    useEffect(() => {
        if (gameQuery) {
            const game = gameQuery;
         

            if (Object.values(game.abandonedAt).every((value) => value === false)) return;

            // Get the most recent abandoner in game.abandonedAt (dictionary of {uid: date-time})
            const abandonerUid = Object.keys(game.abandonedAt).reduce((a, b) => game.abandonedAt[a] > game.abandonedAt[b] ? a : b);

            // If the most recent abandoner is not the current user, print out their name and date-time
            if (!quit) {
                
                // Update users by removing the user with abandonerUid
                const newUsers = {...users};
                delete newUsers[abandonerUid];
                setUsers(newUsers);

                // Count how many humans and impostors are left in the game
                const numHumans = Object.values(newUsers).filter((user) => roles[user.uid] === "human").length;
                const numImpostors = Object.values(newUsers).filter((user) => roles[user.uid] === "impostor").length;

                // TODO: Do sufficient player check logic here
                console.log(numHumans)
                console.log(numImpostors)

                // Check if the abandoner is the person who is currently asking. 
                if (round.asker === abandonerUid && round.status === "ASKING") {
                    // TODO: Show notification to all players
                    console.log("The asker has left the game. Getting a new asker...");
                }

            }
        }
    }, [gameQuery]);

    // Check if game is still active
    useEffect(() => {

        if (gameQuery) {
            const game = gameQuery;

            if (!game.active) {
                
                console.log("The game has ended!")

                setGameOver(true);

                // window.location.href = '/';
            
            }
        }

    }, [gameQuery]);

    // Check if game is over
    useEffect(() => {

        if (gameQuery) {
            
            console.log("Final votes are: ", gameQuery.votes);

            // If the sum of gameQuery.votes is 0, no-body won.
            if (Object.values(gameQuery.votes).reduce((a, b) => a + b) === 0) {
                setTeamWon("Nobody");
            } else {

                // The suspected AI is the person with the most votes in gameQuery.votes
                const suspectedAIuid = Object.keys(gameQuery.votes).reduce((a, b) => gameQuery.votes[a] > gameQuery.votes[b] ? a : b);

                setSuspectedAI(users[suspectedAIuid]);
                
                if (suspectedAIuid === "ai") setTeamWon("Humans");
                else setTeamWon("Impostors");

            }

            // Set game active to false
            gameRef.update({
                active: false
            });
        }

    }, [gameOver]);



    // Check changes in the status of the current round
    useEffect(() => {
  
            
        if (round) {            

            if (round.status === "ASKING") {
                console.log("Round is now in asking phase");

                // If current user is the asker, set isAsking to true
                if (round.asker === user.uid) {
                    setIsAsking(true);
                }
            } 

            else if (round.status === "VOTING"){
                console.log("Round is now in voting phase");
                setTimeLeft(10);
                setIsVoting(true);

                // Decrement voting time left every second. Once it reaches 0, set isVoting to false.
                const interval = setInterval(() => {
                    setTimeLeft(timeLeft => timeLeft - 1);
                }
                , 1000);

                setTimeout(() => {
                    clearInterval(interval);
                    setIsVoting(false);
                
                    finishRound();

                }
                , 10000);


            }

        }

        
    }, [round]);


    function leaveGame() {

        setQuit(true);

        // Set the user's value in abandonedAt to the current date-time.

        
        gameRef.update({
            [`abandonedAt.${user.uid}`]: firebase.firestore.FieldValue.serverTimestamp(),
        });

        window.location.href = '/';
        
    };

    function finishRound(){

        // Get index of current asker and increment. If index goes out of bounds of game.askOrder, set game.active to false.

        const askOrder = gameQuery.askOrder;
        const currentAskerIndex = askOrder.indexOf(round.asker);
        const nextAskerIndex = currentAskerIndex + 1;

        
        // Set current round to "FINISHED"
        roundsRef.doc(round.id).update({
            status: "FINISHED",
        });

        if (nextAskerIndex >= askOrder.length) {

            setGameOver(true);
        
        }
        else {


            if (round.asker === user.uid) {

                const nextAsker = askOrder[nextAskerIndex];
                const newRound = {
                    asker: nextAsker,
                    status: "ASKING",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                };
                roundsRef.add(newRound);
            }

        }

    }
    
    
    return (
        <div>
        <h1>Game</h1>
        <h2>Role: {role}</h2>

        {isLoaded ? (
            gameOver ? (
                <div>
               <h3> Game over! </h3>
                    {teamWon === "Humans" ? (
                    <p> The AI was spotted! </p>
                    ) : teamWon === "Impostors" ? (
                    <p> {`The suspected AI was ${suspectedAI.displayName} which is actually a ${gameQuery.roles[suspectedAI.uid]}!`} </p>
                    ) : (
                    <p> No votes were made! Nobody wins! </p>
                    )}
                </div>
            ) : (
                <div>

                    {
                    isVoting ? (
                    <div>
                        <h3> Voting time! </h3>
                        <p> {timeLeft} seconds left to vote! </p>
                    </div>
                    ) 
                    :
                    (
                        null
                    )
                    }
                    
                    <div>
                        {isAsking ? (
                        <Asker gameId={gameId} round={round} leaveGame={leaveGame} finishRound={finishRound}/>
                        ) : (
                        <Answerer gameId={gameId} round={round} leaveGame={leaveGame}/>
                        )}
                    </div>
                    
                    <Answers gameId={gameId} round={round} role={role} users={users} user={user}/>
                        
                </div>
            )
            ) : (
            <p>Loading...</p>
            )}


        <button type="submit" onClick={leaveGame}>
            Leave
        </button>
        </div>
      );

};

Game.propTypes = {
    user: PropTypes.shape({
    uid: PropTypes.string,
    displayName: PropTypes.string,
    photoURL: PropTypes.string,
    }),
};
  

export default Game;