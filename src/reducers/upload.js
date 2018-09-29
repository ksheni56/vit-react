import { renameProp } from "../utils/Format";

export const UploadActionTypes = {
    UPLOAD_REGISTER: "UPLOAD_REGISTER",
    UPLOAD_REQUEST: "UPLOAD_REQUEST",
    UPLOAD_FAILURE: "UPLOAD_FAILURE",
    UPLOAD_CANCEL: "UPLOAD_CANCEL",
    PROGRESS_UPDATE: "PROGRESS_UPDATE",
    STATUS_UPDATE: "STATUS_UPDATE",
    IPFS_HASH_UPDATE: "IPFS_HASH_UPDATE",
    DATA_UPDATE: "DATA_UPDATE",
    UPLOAD_COMPLETE: "UPLOAD_COMPLETE",
    UPLOAD_REMOVE: "UPLOAD_REMOVE",
    START_TRANCODING_UPDATE: "START_TRANCODING_UPDATE",
    STOP_TRANCODING_UPDATE: "STOP_TRANCODING_UPDATE"
};

export const UploadStatus = {
    UPLOADING: "UPLOADING",
    UPLOADED: "UPLOADED",
    TRANSCODING: "TRANSCODING",
    TRANSCODED: "TRANSCODED",
    COMPLETING: "COMPLETING",
    COMPLETED: "COMPLETED",
    DELETING: "DELETING",
    DELETE_FAILED: "DELETE_FAILED",
    DELETED: 'DELETED',
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
        cancelStatus,
        vit_data // hash, playlist for posting on chain
    } 
} */
const initialState = {
    uploads: {} ,
    initialized: false
}

export default function(state = initialState, action) {
    switch(action.type) {
        case 'LOGOUT': {
            return initialState
        }

        case UploadActionTypes.UPLOAD_REGISTER: {
            const { id, original_filename, cancelToken } = action.payload

            return updateObject(state, id, { original_filename, cancelToken, progress: 0, status: UploadStatus.UPLOADING })
        }
        
        case UploadActionTypes.PROGRESS_UPDATE: {
            const { id: pid, progress } = action.payload

            return updateObject(state, pid, { progress })
        }

        case UploadActionTypes.STATUS_UPDATE: {
            const { id: sid, status } = action.payload

            return updateObject(state, sid, { status: status })
        }

        case UploadActionTypes.IPFS_HASH_UPDATE: {
            const { id: hid, ipfs_hash } = action.payload

            let uploads = Object.assign({}, state.uploads)
            uploads = renameProp(hid, ipfs_hash, uploads)
            uploads[ipfs_hash].status = UploadStatus.UPLOADED

            return Object.assign({}, state, {
                uploads: uploads
            });
        }

        case UploadActionTypes.DATA_UPDATE: {
            const { data } = action.payload
            let uploads = Object.assign({}, state.uploads)
            const keys = Object.keys(data)

            for(let i in keys) {
                const key = keys[i]
                if (uploads.hasOwnProperty(key) && uploads[key].status === UploadStatus.DELETING) continue;

                const upload = Object.assign({}, uploads[key], data[key])
                uploads[key] = upload;
            }

            const ukeys = Object.keys(uploads)
            for(let j in ukeys) {
                const key = ukeys[j]
                if (!keys.includes(key) 
                    && ![UploadStatus.UPLOADING, UploadStatus.UPLOADED].includes(uploads[key].status)) {
                    let {[key]: omit, ...res} = uploads
                    uploads = res
                }
            }

            return Object.assign({}, state, {
                uploads: uploads,
                initialized: true
            });
        }

        case UploadActionTypes.UPLOAD_FAILURE: {
            const { id: fl_id, err } = action.payload

            // because axios see cancelled request as failed request
            // if it is cancelled, don't update failed status and error
            if (state.uploads[fl_id].status === UploadStatus.CANCELLED) return state

            return updateObject(state, fl_id, { status: UploadStatus.FAILED, error: err })
        }

        case UploadActionTypes.UPLOAD_REMOVE: {
            const { id: rid } = action.payload

            const uploads = Object.assign({}, state.uploads)
            
            // don't remove it when it hasn't been posted/cancelled yet
            if (!uploads.hasOwnProperty(rid) || 
                ![UploadStatus.CANCELLED, UploadStatus.COMPLETED, UploadStatus.DELETED].includes(uploads[rid].status))
                return state

            let {[rid]: omit, ...res} = uploads

            return Object.assign({}, state, {
                uploads: res
            });
        }

        default:
            return state
    }
}

function updateObject (state, uid, newValues) {
    const uploads = Object.assign({}, state.uploads)
    const upload = Object.assign({}, uploads[uid], newValues)
    uploads[uid] = upload;

    return Object.assign({}, state, {
        uploads: uploads
    });
}

export const uploadRequest = (upload_backend, formData, headers) => ({
    type: UploadActionTypes.UPLOAD_REQUEST,
    payload: { upload_backend, formData, headers }
})

export const uploadRegister = (id, original_filename, cancelToken) => ({
    type: UploadActionTypes.UPLOAD_REGISTER,
    payload: { id, original_filename, cancelToken }
})

export const updateProgress = (id, progress) => ({
    type: UploadActionTypes.PROGRESS_UPDATE,
    payload: { id, progress }
})

export const uploadCancel = (id, data, endpoint, headers, failedCallback) => ({
    type: UploadActionTypes.UPLOAD_CANCEL,
    payload: { id, data, endpoint, headers, failedCallback }
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

export const updateIPFSHash = (id, ipfs_hash) => ({
    type: UploadActionTypes.IPFS_HASH_UPDATE,
    payload: { id, ipfs_hash }
})

export const updateData = (data) => ({
    type: UploadActionTypes.DATA_UPDATE,
    payload: { data }
})

export const removeUpload = (id) => ({
    type: UploadActionTypes.UPLOAD_REMOVE,
    payload: { id }
})

export const completeUpload = (id, endpoint, headers) => ({
    type: UploadActionTypes.UPLOAD_COMPLETE,
    payload: { id, endpoint, headers }
})

export const startTranscodeCheck = (url) => ({
    type: UploadActionTypes.START_TRANCODING_UPDATE,
    payload: { url }
})

export const stopTranscodeCheck = () => ({
    type: UploadActionTypes.STOP_TRANCODING_UPDATE
})