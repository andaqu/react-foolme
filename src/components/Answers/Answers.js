import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import Answer from './Answer';
import { useFirestoreQuery } from '../../hooks';

const Answers = ({gameId = null, round=null, voteable=false}) => {

    const [answers, setAnswers] = useState([]);

    const db = firebase.firestore();

    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);
    const answersRef = roundRef.collection('answers');

    const answersQuery = useFirestoreQuery(answersRef);
    const [everyoneAnswered, setEveryoneAnswered] = useState(false);

    const roundStatus = round.status || "INITIAL"

    // If roundId changes, reset everyoneAnswered to false
    useEffect(() => {
        setEveryoneAnswered(false);
    }, [round.id]);

    // If round status is VOTING, set everyoneAnswered to true
    useEffect(() => {

        if (roundStatus === 'VOTING') {

            console.log("Everyone answered!")
            setEveryoneAnswered(true);
            
        }
        
    }, [roundStatus]);

    return (
        <div>
          <p>Answers:</p>
          {!everyoneAnswered ? (
            <p>No answers yet!</p>
          ) : (
            answersQuery.map((answer) => (
              <Answer
                key={answer.uid}
                gameId={gameId}
                roundId={round.id}
                uid={answer.id}
                answer={answer.text}
                voteable={voteable}
              />
            ))
          )}
        </div>
      );
}

export default Answers;