import { all } from 'redux-saga/effects';
import { uploadRequestWatcherSaga, transCodingWatcherSaga } from './UploadSagas';

export default function* rootSaga() {
    yield all([
        uploadRequestWatcherSaga(),
        transCodingWatcherSaga()
    ]);
}
