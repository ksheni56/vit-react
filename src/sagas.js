import { delay } from 'redux-saga';
import {
  take, put, call, fork, cancel, cancelled, all,
  select
} from 'redux-saga/effects';

export const START_BACKGROUND_SYNC_COMMENTS = 'START_BACKGROUND_SYNC_COMMENTS';
export const STOP_BACKGROUND_SYNC_COMMENTS = 'STOP_BACKGROUND_SYNC_COMMENTS';
export const CANCELLED_BACKGROUND_SYNC = 'CANCELLED_BACKGROUND_SYNC';

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
        const action = yield take(START_BACKGROUND_SYNC_COMMENTS);
        const bgSyncTask = yield fork(bgSync, action);
        yield take(STOP_BACKGROUND_SYNC_COMMENTS);
        yield cancel(bgSyncTask);
    }
}

export function* rootSaga() {
    console.log("Launching root saga.");
    yield all([
        pollForComments()
    ]);
}