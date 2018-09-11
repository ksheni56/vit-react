import { all } from 'redux-saga/effects';
import { uploadRequestWatcherSaga, transCodingWatcherSaga } from './UploadSagas';
import { pollForCommentsSaga } from './PollComment';

export default function* rootSaga() {
    yield all([
        uploadRequestWatcherSaga(),
        transCodingWatcherSaga(),
        pollForCommentsSaga()
    ]);
}
