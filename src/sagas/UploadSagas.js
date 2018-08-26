import { buffers, eventChannel, END } from "redux-saga";
import { call, put, take, takeEvery } from 'redux-saga/effects';
import {
    UploadActionTypes, uploadFailure, updateStatus,
    updateProgress, uploadRegister, UploadStatus, updateVitData
} from './../reducers/upload'
import axios from 'axios';

// Watch for an upload request and then
// defer to another saga to perform the actual upload
export function* uploadRequestWatcherSaga() {
    yield takeEvery(UploadActionTypes.UPLOAD_REQUEST, uploadFileSaga)
    yield takeEvery(UploadActionTypes.UPLOAD_CANCEL, cancelUpload)
}

// Upload the specified file
export function* uploadFileSaga(action) {
    const { upload_backend, formData, headers } = action.payload
    const channel = yield call(createUploadFileChannel, upload_backend, formData, headers);

    // temp unique upload ID
    const fileName = formData.get("file").name;
    const uid = Date.now() + "_" + fileName;

    while (true) {
        const { progress = 0, err, success, cancelToken, transcodingURL } = yield take(channel);
        if (cancelToken) {
            yield put(uploadRegister(uid, fileName, cancelToken))
        }
        if (err) {
            yield put(uploadFailure(uid, err))
            return;
        }
        if (success) {
            yield put(updateStatus(uid, UploadStatus.UPLOADED))
            yield call(transcodeCheck, uid, transcodingURL)
            return;
        }
        yield put(updateProgress(uid, progress));
    }
}

function createUploadFileChannel(endpoint, formData, headers) {
    return eventChannel(emitter => {

        const onProgress = (e) => {
            if (e.lengthComputable) {
                const progress = Math.round((e.loaded * 100) / e.total);
                emitter({ progress });
            }
        };

        const onFailure = (e) => {
            emitter({ err: new Error("Upload failed") });
            emitter(END);
        };

        const CancelToken = axios.CancelToken;
        const source = CancelToken.source();

        axios.post(endpoint, formData, {
            headers: headers,
            onUploadProgress: onProgress,
            cancelToken: source.token
        })
            .then(response => {
                if (response.status === 200) {
                    emitter({ success: true, transcodingURL: response.data.url });
                    emitter(END);
                } else {
                    onFailure(null);
                }
            })
            .catch(e => onFailure(e))

        emitter({ cancelToken: source })

        return () => { }
    }, buffers.sliding(2));
}

// might refactor this when we have /history backend ready, to reduce calls to backend for every uploaded file.
function* transcodeCheck(uid, transcodingURL) {
    const channel = yield call(createTranscodeCheckChannel, transcodingURL)

    yield put(updateStatus(uid, UploadStatus.TRANSCODING))
    yield put(updateProgress(uid, 0)) // reset progress

    while (true) {
        const { progress = 0, err, success, vit_data } = yield take(channel)

        if (err) {
            // no need if failed to request to transcoding backend?
            // yield put(uploadFailure(uid, err));
            return;
        }
        if (success) {
            yield put(updateStatus(uid, UploadStatus.COMPLETED))
            yield put(updateVitData(uid, vit_data))
            return;
        }
        yield put(updateProgress(uid, progress))
    }
}

function createTranscodeCheckChannel(transcodingURL) {
    return eventChannel(emitter => {

        const onFailure = (e) => {
            emitter({ err: new Error("Cannot check transcoding") });
            emitter(END);
        };

        const refreshInterval = setInterval(() => {
            axios.get(transcodingURL)
                .then(response => {
                    if (!response.data.Complete) {
                        // not complete yet
                        console.log(response)
                        emitter({ progress: response.data.PercentComplete })
                        //console.log("Transcode Progress:", response.data.PercentComplete)
                    } else {
                        emitter({ success: true, vit_data: response.data })
                        emitter(END);
                        console.log("Done!", response.data)
                    }
                })
                .catch(e => onFailure(e))
        }, 2000);

        return () => {
            clearInterval(refreshInterval)
        }
    }, buffers.sliding(2))
}

function* cancelUpload(action) {
    const { id, data } = action.payload
    data.cancelToken.cancel()
    yield put(updateStatus(id, UploadStatus.CANCELLED))
}
