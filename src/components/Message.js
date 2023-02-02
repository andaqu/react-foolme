import React from 'react';
import { formatRelative } from 'date-fns';
import PropTypes from 'prop-types';
import firebase from 'firebase/compat/app';

const formatDate = date => {
    let formattedDate = '';
    if (date) {
      formattedDate = formatRelative(date, new Date());
      formattedDate =
        formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }
    return formattedDate;
};

const Message = ({ createdAt, text, uid }) => {
    const db = firebase.firestore();
    const [user, setUser] = React.useState({});

    React.useEffect(() => {
        const userRef = db.collection('users').doc(uid);
        userRef.get().then(doc => {
            if (doc.exists) {
                setUser(doc.data());
            }
        }).catch(error => {
            console.log("Error getting document:", error);
        });
    }, [db, uid]);

    return (
        <div>
            {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" />
            ) : null}
            {user.displayName ? <p>{user.displayName}</p> : null}
            {createdAt ? (
                <span>{formatDate(new Date(createdAt.seconds * 1000))}</span>
            ) : null}
            {text ? <p>{text}</p> : null}
        </div>
    );
};

Message.propTypes = {
    text: PropTypes.string,
    createdAt: PropTypes.shape({
      seconds: PropTypes.number,
    }),
    uid: PropTypes.string,
};

export default Message;
