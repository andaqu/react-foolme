import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery } from '../hooks';

const Asker = ({gameId = null, round=null}) => {

    const [newQuestion, setNewQuestion] = useState('');
    const [asked, setAsked] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');

    const db = firebase.firestore();
    
    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);

    const [timeLeft, setTimeLeft] = useState(30);

    // Set timer for 30 seconds. When timer reaches 0, console log "Time's up!"

    useEffect(() => {
        if (!asked) {
            if (timeLeft > 0) {
                setTimeout(() => {
                    setTimeLeft(timeLeft - 1);
                }, 1000);
            } else if (timeLeft === 0) {
                // TODO: Logic that kicks the player out due to inactivity
                console.log("Time's up!");
            }
        }
    }, [timeLeft, asked]);

    useEffect(() => {

        if (round) {
            setCurrentQuestion(round.question);
        }

    }, [round]);

    const handleOnSubmit = (e) => {
        e.preventDefault();
        
        // Add question to round
        roundRef.update({
            question: newQuestion,
            status: 'ANSWERING'
        });

        // TODO: Call function to send question and roundID to generate AI answer. Once AI answer is obtained, proceed.

        setCurrentQuestion(newQuestion)

        setAsked(true);

    }

    const handleOnChange = e => {
        setNewQuestion(e.target.value);
      };
    
    return (
        <div>
            {asked ? (
            
            <h3>Question: {currentQuestion}</h3>

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
            
        </div>
    );


}

export default Asker;