import { all } from 'redux-saga/effects';
import { uploadRequestWatcherSaga } from './UploadSagas';

export default function* rootSaga() {
    yield all([
        uploadRequestWatcherSaga()
    ]);
}
