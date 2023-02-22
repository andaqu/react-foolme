import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery, generateAIAnswer } from '../hooks';

const Asker = ({gameId = null, round=null}) => {

    const [newQuestion, setNewQuestion] = useState('');
    const [asked, setAsked] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');

    const db = firebase.firestore();
    
    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);
    const answersRef = roundRef.collection('answers');

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