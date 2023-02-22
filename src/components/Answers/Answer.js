import React, { useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery } from '../../hooks';

const Answer = ({ gameId, roundId, answer, uid, voteable=false, handleOnClick, canVote}) => {
    const db = firebase.firestore();

    const gameRef = db.collection('games').doc(gameId);
    const roundRef = gameRef.collection('rounds').doc(roundId);

    const usersRef = db.collection('users');
    const answersRef = roundRef.collection('answers');

    const userQuery = useFirestoreQuery(usersRef.where("uid", '==', uid))[0];
    const answerQuery = useFirestoreQuery(answersRef.where(firebase.firestore.FieldPath.documentId(), '==', uid))[0];

    const [user, setUser] = useState({});

    const [votes, setVotes] = useState(0);

    useEffect(() => {
        
        if (userQuery) {
            if(userQuery.uid  !== uid) {
                console.log("Something weird is going on here. userQuery.uid = " + userQuery.uid + " and user.uid = " + uid);

            }
            setUser(userQuery);
        }

    }, [userQuery]);

    useEffect(() => {

        if (answerQuery) {
            setVotes(answerQuery.votes);
        }

    }, [answerQuery]);

   

    return (
        <div>
            {user.photoURL ? (
                <img width="50" height="50" src={user.photoURL} alt="Avatar"/>
            ) : null}
            {user.displayName ? <p>{user.displayName}</p> : null}
            {answer ? <p>{answer}</p> : null}
            {voteable ? (
                <div>
                    <button disabled = {canVote} onClick={() => handleOnClick(uid)}>Vote</button>
                    <p>Votes: {votes}</p>
                </div>
            ) : null}
        </div>
    );
};

Answer.propTypes = {
    text: PropTypes.string,
    uid: PropTypes.string,
};

export default Answer;
