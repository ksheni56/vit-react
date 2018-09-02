import { buffers, eventChannel, END, delay } from "redux-saga";
import { call, put, take, takeEvery, fork, cancel, cancelled } from 'redux-saga/effects';
import {
    UploadActionTypes, uploadFailure, updateStatus,
    updateProgress, uploadRegister, UploadStatus, updateVitData, updateData, updateIPFSHash
} from './../reducers/upload'
import axios from 'axios';

// Watch for an upload request and then
// defer to another saga to perform the actual upload
export function* uploadRequestWatcherSaga() {
    yield takeEvery(UploadActionTypes.UPLOAD_REQUEST, uploadFileSaga)
    yield takeEvery(UploadActionTypes.UPLOAD_CANCEL, cancelUpload)
}

export function* transCodingWatcherSaga() {
    while ( true ) {
        const action = yield take(UploadActionTypes.START_TRANCODING_UPDATE)

        // starts the task in the background
        const trancodeCheckTask = yield fork(transcodeCheck, action)

        // wait for the user stop action
        yield take(UploadActionTypes.STOP_TRANCODING_UPDATE)

        // user clicked stop. cancel the background task
        // this will cause the forked bgSync task to jump into its finally block
        yield cancel(trancodeCheckTask)
    }
}

// Upload the specified file
export function* uploadFileSaga(action) {
    const { upload_backend, formData, headers } = action.payload
    const channel = yield call(createUploadFileChannel, upload_backend, formData, headers);

    // temp unique upload ID
    const original_filename = formData.get("file").name;
    const uid = Date.now() + "_" + original_filename;

    while (true) {
        const { progress = 0, err, success, cancelToken, ipfs_hash } = yield take(channel);
        if (cancelToken) {
            yield put(uploadRegister(uid, original_filename, cancelToken))
        }
        if (err) {
            yield put(uploadFailure(uid, err))
            return;
        }
        if (success) {
            yield put(updateStatus(uid, UploadStatus.UPLOADED))
            yield put(updateIPFSHash(uid, ipfs_hash))
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
                    const transcodingURL = response.data.url
                    const ipfs_hash = transcodingURL.substr(transcodingURL.lastIndexOf("/") + 1);
                    emitter({ success: true, ipfs_hash: ipfs_hash});
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
function* transcodeCheck(action) {
    const { url: backendURL } = action.payload
    const channel = yield call(createTranscodeCheckChannel, backendURL)

    try {
        while (true) {
            const { data, err } = yield take(channel)

            if (err) {
                // no need if failed to request to transcoding backend?
                // yield put(uploadFailure(uid, err));
                return;
            }

            yield put(updateData(data))
        }
    
    } finally {
        if (yield cancelled()) {
            channel.close()
            yield put({
                type: "CANCELLED_BACKGROUND_SYNC"
            });
        }
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
                    if (response.status !== 200) return
                    if (!response.data.hasOwnProperty('uploads')) return

                    const transcodedFiles = {}
                    for (let i in response.data.uploads) {
                        const keys = Object.keys(response.data.uploads[i])
                        const file = response.data.uploads[i][keys[0]]
                        const data = {
                            original_filename: file.original_filename, 
                            progress: file.percent_complete,
                            status: file.status !== "end" ? UploadStatus.TRANSCODING : UploadStatus.COMPLETED,
                            vit_data: {
                                Hash: file.ipfs_hash,
                                Playlist: file.playlist
                            }
                        }
                        transcodedFiles[keys[0]] = data
                    }

                    emitter({data: transcodedFiles})
                    // console.log(response)
                })
                .catch(e => onFailure(e))
        }, 2000)

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
