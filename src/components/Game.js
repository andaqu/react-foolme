import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import PropTypes from 'prop-types';
import Answerer from './Answerer';
import Asker from './Asker';
import Answers from './Answers/Answers';
import { useFirestoreQuery } from '../hooks';


const Game = ({ user, role, gameId = null} ) => {

    const db = firebase.firestore();
    
    const gamesRef = db.collection('games');
    const gameRef = gamesRef.doc(gameId);
    const roundsRef = gameRef.collection('rounds')

    const [currentAsker, setCurrentAsker] = useState({});
    const [currentRoundId, setCurrentRoundId] = useState(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [isVoting, setIsVoting] = useState(false);

    const [quit, setQuit] = useState(false);

    const [gameOver, setGameOver] = useState(false);

    const [votingTimeLeft, setVotingTimeLeft] = useState(0);

    const latestRoundQuery = useFirestoreQuery(roundsRef.orderBy('createdAt', 'desc').limit(1))[0];
    const round = latestRoundQuery || {};
    
    const gameQuery = useFirestoreQuery(gamesRef
        .where(firebase.firestore.FieldPath.documentId(), '==', gameId))[0];

    const [suspectedAI, setSuspectedAI] = useState(null);

    // If user refreshes page or navigates away, call leaveGame function
    useEffect(() => {
        window.addEventListener('beforeunload', leaveGame);
        return () => {
          window.removeEventListener('beforeunload', leaveGame);
        };
      }, []);

    // Always get the latest round in roundsRef
    useEffect(() => {
        
        if (latestRoundQuery) {
            const round = latestRoundQuery;
            setCurrentRoundId(round.id);
            setIsLoaded(true);
        }
        
    }, [latestRoundQuery]);

    // Check if game is still active
    useEffect(() => {

        if (gameQuery) {
            const game = gameQuery;

            if (!game.active) {
                
                if(!quit) {
                    alert('The other user has left the game. Redirecting to home page...');
                    // Wait 2 seconds before redirecting
                }

                window.location.href = '/';
            }
        }

    }, [gameQuery]);

    // Check changes in the status of the current round
    useEffect(() => {
  
        if (currentRoundId) {
            
            if (round) {
                console.log("Latest round query is " + round.status)
                

                if (round.status === "ASKING") {
                    console.log("Current asker ID is " + round.asker + " and you are " + user.uid);
                    setCurrentAsker(round.asker);
                } 

                else if (round.status === "VOTING"){
                    console.log("Round is now in voting phase");
                    setVotingTimeLeft(10);
                    setIsVoting(true);

                    // Decrement voting time left every second. Once it reaches 0, set isVoting to false.
                    const interval = setInterval(() => {
                        setVotingTimeLeft(votingTimeLeft => votingTimeLeft - 1);
                    }
                    , 1000);

                    setTimeout(() => {
                        clearInterval(interval);
                        setIsVoting(false);
                    

                        // Get index of current asker and increment. If index goes out of bounds of game.ask_order, set game.active to false.

                        const askOrder = gameQuery.ask_order;
                        const currentAskerIndex = askOrder.indexOf(round.asker);
                        const nextAskerIndex = currentAskerIndex + 1;

                        if (nextAskerIndex >= askOrder.length) {
                            setGameOver(true);
                            // The suspected AI is the person with the most votes across all rounds.
                            // TODO: Get the suspected AI
                        }
                        else {
                            const nextAsker = askOrder[nextAskerIndex];
                            const newRound = {
                                asker: nextAsker,
                                status: "ASKING",
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            };
                            roundsRef.add(newRound);
                        }

                    }
                    , 10000);


                }

            }

        }
    }, [currentRoundId, round.status]);


    const leaveGame = () => {

        setQuit(true);

        // Set game active to false
        gameRef.update({
            active: false,
        });

        alert('You have left the game. Redirecting to home page...')
    };
    
    
    return (
        <div>
        <h1>Game</h1>
        <h2>Role: {role}</h2>

        {isLoaded ? (
            gameOver ? (
                <div>
                <h3> Game over! </h3>
                <p> The suspected AI is {suspectedAI} </p>
                </div>
            ) : (
                isVoting ? (
                <div>
                    <h3> Voting time! </h3>
                    <p> {votingTimeLeft} seconds left to vote! </p>
                    <Answers gameId={gameId} round={round} voteable={true} />
                </div>
                ) : (
                <div>
                    {currentAsker === user.uid ? (
                    <Asker gameId={gameId} round={round} />
                    ) : (
                    <Answerer gameId={gameId} round={round}  />
                    )}
                    <Answers gameId={gameId} round={round}  />
                </div>
                )
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