import { delay } from 'redux-saga';
import {
  take, put, call, fork, cancel, cancelled, all,
  select
} from 'redux-saga/effects';

const initialState = {
    "username": null,
    "publicWif": null,
    "authorized": false,
    "subs": [],
    "comment_changed": false
};

export const START_BACKGROUND_SYNC = 'START_BACKGROUND_SYNC';
export const STOP_BACKGROUND_SYNC = 'STOP_BACKGROUND_SYNC';
export const CANCELLED_BACKGROUND_SYNC = 'CANCELLED_BACKGROUND_SYNC';

export default function(state = initialState, action) {

    switch(action.type) {

        case 'LOGIN_USER':

            return Object.assign({}, state, {
                "username": action.payload.username,
                "publicWif": action.payload.publicWif,
                "postingWif": action.payload.postingWif,
                "authorized": true
            });

        case 'LOGOUT':

            return Object.assign({}, state, {
            	"username": null,
                "publicWif": null,
                "authorized": false
            });

        case 'UPDATE_USER':

            let UpdatedObject = action.payload,
                UserObject = Object.assign({}, state.user); // clone user object to work with

            for (var property in UpdatedObject) {
                UserObject[property] = UpdatedObject[property]; // update the keys from UpdatedObject only
            }

            return Object.assign({}, state, {
                user: UserObject
            });

        case 'GET_SUBS':
        
            return Object.assign({}, state, {
                subs: action.payload
            });

        case 'COMMENT_SUCCESS':
            return Object.assign({}, state, {
                comment_changed: true
            });    

        default:
            return state;
    }

}

const POLLING_INTERVAL = 5000; // 5 second polling interval

function* bgSync(action) {
    try {
        while(true) {
            const state = yield select();
            yield call(action.callback, action, undefined, state);
            yield call(delay, POLLING_INTERVAL);
        }
    } finally {
        if (yield cancelled()) {
            yield put({
                type: CANCELLED_BACKGROUND_SYNC
            });
        }
    }
}

function* pollForComments() {
    while(true) {
        const action = yield take(START_BACKGROUND_SYNC);
        const bgSyncTask = yield fork(bgSync, action);
        yield take(STOP_BACKGROUND_SYNC);
        yield cancel(bgSyncTask);
    }
}

export function* rootSaga() {
    console.log("Launching root saga.");
    yield all([
        pollForComments()
    ]);
}
