import React, { useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery } from '../../hooks';

const Answer = ({ gameId, roundId, answer, uid, voteable=false }) => {
    const db = firebase.firestore();

    

    const gameRef = db.collection('games').doc(gameId);
    const roundRef = gameRef.collection('rounds').doc(roundId);

    const userRef = db.collection('users');
    const answersRef = roundRef.collection('answers');
    const answerRef = answersRef.doc(uid);

    const userQuery = useFirestoreQuery(userRef.where(firebase.firestore.FieldPath.documentId(), '==', uid))[0];
    const answerQuery = useFirestoreQuery(answersRef.where(firebase.firestore.FieldPath.documentId(), '==', uid))[0];

    const [user, setUser] = useState({});

    const [votes, setVotes] = useState(0);

    const [alreadyVoted, setAlreadyVoted] = useState(false);

    useEffect(() => {
        
        if (userQuery) {
            setUser(userQuery);
        }

    }, [userQuery]);

    useEffect(() => {

        if (answerQuery) {
            setVotes(answerQuery.votes);
        }

    }, [answerQuery]);

    const handleOnClick = () => {

        answerRef.update({
            votes: firebase.firestore.FieldValue.increment(1)
        });

        // Update gameRef with new vote. gameRef has a field called "votes" which is a dictionary of {uid: votes}.

        gameRef.get().then((doc) => {
            
            if (doc.exists) {

                var votes = doc.data().votes;
                if (votes) {
                    if (votes[uid]) {
                        votes[uid] += 1;
                    } else {
                        votes[uid] = 1;
                    }
                } else {
                    votes = {};
                    votes[uid] = 1;
                }
                gameRef.update({
                    votes: votes
                });
            }

        });

        setAlreadyVoted(true);
    }

    return (
        <div>
            {user.photoURL ? (
                <img width="50" height="50" src={user.photoURL} alt="Avatar"/>
            ) : null}
            {user.displayName ? <p>{user.displayName}</p> : null}
            {answer ? <p>{answer}</p> : null}
            {voteable ? (
                <div>
                    <button disabled = {uid === firebase.auth().currentUser.uid || alreadyVoted} onClick={handleOnClick}>Vote</button>
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
