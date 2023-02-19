import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery } from '../hooks';

const Asker = ({gameId = null, round=null}) => {

    const [newQuestion, setNewQuestion] = useState('');
    const [asked, setAsked] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');

    const db = firebase.firestore();

    const roundsRef = firebase.firestore().collection('games').doc(gameId).collection('rounds');
    const gameRef = db.collection('games').doc(gameId);
    const roundRef = gameRef.collection('rounds').doc(round.id);


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
            status: 'ASKED'
        });

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