export const UploadActionTypes = {
    UPLOAD_REGISTER: "UPLOAD_REGISTER",
    UPLOAD_REQUEST: "UPLOAD_REQUEST",
    UPLOAD_FAILURE: "UPLOAD_FAILURE",
    UPLOAD_CANCEL: "UPLOAD_CANCEL",
    PROGRESS_UPDATE: "PROGRESS_UPDATE",
    STATUS_UPDATE: "STATUS_UPDATE",
    VIT_DATA_UPDATE: "VIT_DATA_UPDATE"
};

export const UploadStatus = {
    UPLOADING: "UPLOADING",
    UPLOADED: "UPLOADED",
    TRANSCODING: "TRANSCODING",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    FAILED: "FAILED"
}

/* contains a list of 
{ upload ID => 
    {
        file name, 
        progress (for both upload and transcode), 
        cancelToken, 
        status,
        transcodingURL,
        vit_data // hash, playlist for posting on chain
    } 
} */
const initialState = {
    uploads: {}  
}

export default function(state = initialState, action) {
    switch(action.type) {
        case UploadActionTypes.UPLOAD_REGISTER: {
            const { id, fileName, cancelToken } = action.payload

            return updateObject(state, id, { fileName, cancelToken, progress: 0, status: UploadStatus.UPLOADING })
        }
        
        case UploadActionTypes.PROGRESS_UPDATE: {
            const { id: pid, progress } = action.payload

            return updateObject(state, pid, { progress })
        }

        case UploadActionTypes.STATUS_UPDATE: {
            const { id: sid, status } = action.payload

            return updateObject(state, sid, { status: status })
        }

        case UploadActionTypes.UPLOAD_FAILURE: {
            const { id: fl_id, err } = action.payload

            // because axios see cancelled request as failed request
            // if it is cancelled, don't update failed status and error
            if (state.uploads[fl_id].status === UploadStatus.CANCELLED) return state

            return updateObject(state, fl_id, { status: UploadStatus.FAILED, error: err })
        }

        case UploadActionTypes.VIT_DATA_UPDATE: {
            const { id: vid, data } = action.payload

            return updateObject(state, vid, { vit_data: data })
        }

        default:
            return state
    }
}

function updateObject (state, uid, newValues) {
    const uploads = Object.assign({}, state.uploads)
    const upload = Object.assign({}, uploads[uid], newValues)
    uploads[uid] = upload;

    return Object.assign({}, state.uploads, {
        uploads: uploads
    });
}

export const uploadRequest = (upload_backend, formData, headers) => ({
    type: UploadActionTypes.UPLOAD_REQUEST,
    payload: { upload_backend, formData, headers }
})

export const uploadRegister = (id, fileName, cancelToken) => ({
    type: UploadActionTypes.UPLOAD_REGISTER,
    payload: { id, fileName, cancelToken }
})

export const updateProgress = (id, progress) => ({
    type: UploadActionTypes.PROGRESS_UPDATE,
    payload: { id, progress }
})

export const uploadCancel = (id, data) => ({
    type: UploadActionTypes.UPLOAD_CANCEL,
    payload: { id, data }
})

export const updateStatus = (id, status) => ({
    type: UploadActionTypes.STATUS_UPDATE,
    payload: { id, status }
})

export const uploadFailure = (id, err) => ({
    type: UploadActionTypes.UPLOAD_FAILURE,
    payload: { id, err },
    error: true,
})

export const updateVitData = (id, data) => ({
    type: UploadActionTypes.VIT_DATA_UPDATE,
    payload: { id, data }
})