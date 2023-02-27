import React, { useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery } from '../../hooks';

const Answer = ({ gameId, roundId, answer, uid, handleOnClick, canVote}) => {
    const db = firebase.firestore();

    const gameRef = db.collection('games').doc(gameId);
    const roundRef = gameRef.collection('rounds').doc(roundId);

    const answersRef = roundRef.collection('answers');

    const answerQuery = useFirestoreQuery(answersRef.where(firebase.firestore.FieldPath.documentId(), '==', uid))[0];

    const [votes, setVotes] = useState(0);

    useEffect(() => {

        if (answerQuery) {
            setVotes(answerQuery.votes);
        }

    }, [answerQuery]);


    return (
        <div>
            <p> {answer} </p>
            <div>
                <button disabled = {!canVote} onClick={() => handleOnClick(uid)}>Vote</button>
                <p>Votes: {votes}</p>
            </div>
        </div>
    );
};


export default Answer;
