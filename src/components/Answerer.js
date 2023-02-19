import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery } from '../hooks';

const Answerer = ({gameId = null, round}) => {

    const [newAnswer, setNewAnswer] = useState('');
    const [answered, setAnswered] = useState(false);

    const db = firebase.firestore();
    
    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);
    const answersRef = roundRef.collection('answers');
    const answerRef = answersRef.doc(firebase.auth().currentUser.uid)

    const [currentQuestion, setCurrentQuestion] = useState('');

    useEffect(() => {

          if (round) {
              setCurrentQuestion(round.question);
          }

    }, [round]);

    const handleOnSubmit = (e) => {
        e.preventDefault();
        
        // Add answer to round's answers collection in the form of {uid: answer}
        answerRef.set({
            text: newAnswer,
            votes: 0
        });

        setAnswered(true);

        // If documents in AnswersRef == 1, set status of round to "VOTING"
        answersRef.get().then((querySnapshot) => {
            if (querySnapshot.size == 1) {
                roundRef.update({
                    status: 'VOTING'
                });
            }
        });



    }

    const handleOnChange = e => {
        setNewAnswer(e.target.value);
      };
    
      return (
        <div>
          
          {answered ? (
            <div>
            <h3>Question: {currentQuestion}</h3>
            <p>You have already answered the question.</p>
            </div>
          ) : currentQuestion ? (
            <div>
              <h3>Question: {currentQuestion}</h3>
              <div>
                <form onSubmit={handleOnSubmit}>
                  <input
                    type="text"
                    value={newAnswer}
                    onChange={handleOnChange}
                    placeholder="Type your answer here..."
                  />
                  <button type="submit" disabled={!newAnswer}>
                    Send
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <p>Waiting for question to be asked...</p>
          )}
        </div>
      );
      
}

export default Answerer;