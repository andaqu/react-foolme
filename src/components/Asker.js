import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery, generateAIAnswer } from '../hooks';
import Answerer from './Answerer';

const Asker = ({gameId = null, round=null,  leaveGame, finishRound}) => {

    const [newQuestion, setNewQuestion] = useState('');
    const [asked, setAsked] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');

    const db = firebase.firestore();
    
    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);
    const answersRef = roundRef.collection('answers');

    const [timeLeft, setTimeLeft] = useState(5);
    const [inActive, setInActive] = useState(false);


    useEffect(() => {
        if (!asked && round.status === "ASKING" && !inActive) {
            if (timeLeft > 0) {
                setTimeout(() => {
                    setTimeLeft(timeLeft - 1);
                }, 1000);
            } else if (timeLeft === 0) {
                
                console.log("Set Asker to inactive")
                setInActive(true);

                finishRound();
                
                // Wait for 2 seconds before kicking the player out
                setTimeout(() => {
                    leaveGame();
                }, 5000);


            }
        }
    }, [timeLeft, asked]);

    useEffect(() => {

        if (round) {
            setCurrentQuestion(round.question);
        }

    }, [round]);

    const handleOnSubmit = async (e) => {
        e.preventDefault();


        // Check if question is already in game's aiAnswers dictionary
        // If it is, it means that it has already been asked

        const game = await gameRef.get().then((doc) => {
            return doc.data();
        });
        const previousAIAnswers = game.aiAnswers;

        if (previousAIAnswers[newQuestion]) {
            alert("This question has already been asked!");
            return;
        }
 
        setAsked(true);

        const aiAnswer = await generateAIAnswer(newQuestion, previousAIAnswers);

        // Add question to round
        roundRef.update({
            question: newQuestion,
            status: 'ANSWERING'
        });

        // Add AI answer to round's answers collection in the form of {uid: answer}
        answersRef.doc('ai').set({
            text: aiAnswer,
            votes: 0
        });

        // Add question:answer pair to game's aiAnswers dictionary
        gameRef.update({
            aiAnswers: {
                [newQuestion]: aiAnswer, 
                ...previousAIAnswers
            }
        });

        setCurrentQuestion(newQuestion)

        

    }

    const handleOnChange = e => {
        setNewQuestion(e.target.value);
      };
    
    return (
        <div>
            {!inActive && (
                <>
                {asked ? (
                    <Answerer gameId={gameId} round={round} leaveGame={leaveGame} />
                ) : (
                    <div>
                    <p>It's your turn to ask a question!</p>
                    <p>Time left to ask: {timeLeft}</p>
                    <form onSubmit={handleOnSubmit}>
                        <input
                        type="text"
                        value={newQuestion}
                        onChange={handleOnChange}
                        placeholder="Type your question here..."
                        />
                        <button type="submit" disabled={!newQuestion}>
                        Send
                        </button>
                    </form>
                    </div>
                )}
                </>
            )}

            {inActive && (
                <div>
                <p>You have been kicked out due to inactivity!</p>
                <p>Returning to home page in 5 seconds...</p>
                </div>
            )}  
        </div>

    );


}

export default Asker;