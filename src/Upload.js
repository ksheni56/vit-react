import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import Dropzone from 'react-dropzone';
import { Link } from 'react-router-dom';
import { post } from './actions/post';
import Formsy from 'formsy-react';
import TextField from './components/forms/TextField';
import TextArea from './components/forms/TextArea';
import CreatableSelect from 'react-select/lib/Creatable';
import './sass/Select.scss';
import { ToastContainer, toast } from 'react-toastify';
import { Line } from 'rc-progress';
import { VIDEO_UPLOAD_ENDPOINT, VIDEO_THUMBNAIL_URL_PREFIX, VIDEO_HISTORY_ENDPOINT, VIDEO_UPLOAD_POSTED_ENDPOINT } from './config'
import { uploadRequest, UploadStatus, uploadCancel, startTranscodeCheck, stopTranscodeCheck, completeUpload, removeUpload } from './reducers/upload';
import HLSSource from './HLS';
import { Player, BigPlayButton } from 'video-react';

class Upload extends Component {

    constructor(props) {

        super(props);

        this.state = {
            'uploading': false,
            'files': [],
            'error': false,
            'error_type': 'generic',
            'generic_error_text': 'Could not upload your file. Please try again!',
            'custom_error_text': '',
            'success': false,
            'title': '',
            'selected_category': [],
            'categories': [],
            'loading_categories': true,
            'tags': [],
            'selected_tags': [],
            'progress': null,
            'permlink': '',
            'transcoding': false,
            'transcode_progress': 0,
            'uploadVideos': []
        }

        this.creatableRef = null;
        this.handleDrop = this.handleDrop.bind(this);
        this.handleDropRejected = this.handleDropRejected.bind(this);
        this.handleChangeCategory = this.handleChangeCategory.bind(this);
        this.handleOnKeyDown = this.handleOnKeyDown.bind(this);
        this.upload = this.upload.bind(this);
        this.setPreviewPost = this.setPreviewPost.bind(this);
        this.showUploadForm = this.showUploadForm.bind(this);
        this.postVideo = this.postVideo.bind(this);
    } 

    componentDidMount() {

        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }
        
        // update transcoding progress
        this.props.startTranscodeCheck(VIDEO_HISTORY_ENDPOINT + "/" + this.props.app.username + "?posted=false")

        // TODO: change 'life'
        steem.api.getTrendingTags('', 60, (err, result) => {

            let categories = [];

            for(var i in result) {
                if(result[i]['name'] !== '') {
                    categories.push({ value: result[i]['name'], label: result[i]['name']})
                }
            }
            
            this.setState({
                categories: categories,
                loading_categories: false
            });

        });

    }

    componentWillUnmount () {
        this.props.stopTranscodeCheck()
    }

    setPreviewPost(key, file, type) {

        if (type === 'add') {
            // show the Upload form
            if (this.state.uploadVideos.length === 0) {
                this.setState({
                    uploadVideos: [...this.state.uploadVideos, {[key]: {'post': '', 'file': file} }]
                });
            } else {
                let foundObject = this.state.uploadVideos.find(e => {
                    return e.hasOwnProperty(key);
                });

                if (!foundObject || foundObject === undefined) {
                    this.setState({
                        uploadVideos: [...this.state.uploadVideos, {[key]: {'post': '', 'file': file} }]
                    })
                }
            }
        } else {
            // hide the Upload form
            const uploadVideos = [...this.state.uploadVideos];
            const foundObject = uploadVideos.find(e => {
                return e.hasOwnProperty(key);
            });

            const index = uploadVideos.indexOf(foundObject);
            uploadVideos.splice(index, 1);
            this.setState({
                uploadVideos: uploadVideos
            });
        }
    }

    postVideo(form) {
        const hash = form.taskId;
        const uploadVideos = [...this.state.uploadVideos];
        const updateObject = uploadVideos.find(e => {
            return e.hasOwnProperty(hash);
        });

        const vit_data = updateObject[hash].file.vit_data;
        let slug = form.title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

        let categories = [];
        if(this.state.selected_category.length > 0 ) {
       
            for(var i in this.state.selected_category) {
                if(i < 5) categories.push(this.state.selected_category[i]['value']);
            }
        
        } else {
            toast.error("Please select at least 1 category!");
            return false;
        }

        this.setState({
            error: false,
            uploading: true
        });

        // I. POST VIDEO
        this.props.post({
            postingWif: this.props.app.postingWif, 
            category: categories[0], // category
            username: this.props.app.username, 
            slug: slug, // slug
            title: form.title, // title
            body: form.description, // body,
            tags: categories,
            vit_data: vit_data

        }).then( response => {

            console.log("post blockchain success", response);

            const headers = {
                'Content-Type': 'text/html',
                'X-Auth-Token': localStorage.getItem("signature"),
                'X-Auth-UserHost': localStorage.getItem("signUserHost")
            }

            this.props.completeUpload(hash, VIDEO_UPLOAD_POSTED_ENDPOINT + hash, headers)

            this.setState({
                uploading: false
            })

        }).catch(err => {

            console.log("post error", err)

            if(err.payload.data && err.payload.data.stack[0].format === '( now - auth.last_root_post ) > STEEMIT_MIN_ROOT_COMMENT_INTERVAL: You may only post once every 5 minutes.') {
                
                this.setState({
                    error: true,
                    error_type: 'timeout',
                    custom_error_text: 'You may only post once every 5 minutes.',
                    uploading: false
                });

            } else {

                this.setState({
                    error: true,
                    error_type: 'other',
                    uploading: false,
                    custom_error_text: err.payload.data.stack[0].format
                });

            }

            toast.error(this.state.custom_error_text);
        });
    }

    upload(files) {

        // todo: parse tags & cats

        if(!this.props.app.authorized) {
            alert("Not so fast! You have to be logged in to upload your content!");
            return false;
        }

        // do count the current pending posts and files dropped by user
        const pendingPosts = Object.keys(this.props.uploads).length;

        if (files.length + pendingPosts > 5) {
            toast.error("Warning! Cannnot upload more than 5 files. Please post your pending ones");
            return false;
        }

        // get signed signature for Video Upload Authorisation
        const signature = localStorage.getItem("signature");
        const signUserHost = localStorage.getItem("signUserHost");

        const headers = {
            'Content-Type': 'multipart/form-data',
            'X-Auth-Token':  signature,
            'X-Auth-UserHost': signUserHost
        }

        files.forEach(file => {
            let formData = new FormData();
            formData.append('username', this.props.app.username);
            formData.append('file', file);

            this.props.onUpload(VIDEO_UPLOAD_ENDPOINT, formData, headers)
        })
    }

    handleDrop(files) {
        // set uploading in progress
        this.upload(files)
    }

    handleOnKeyDown = (event) => {
        switch(event.key) {
            case ' ':
                this.creatableRef.select.select.selectOption(this.creatableRef.select.select.state.focusedOption);
        }
    }

    handleChangeCategory(category) {
        this.setState({
            selected_category: category
        });
    }

    showUploadForm(key, file) {
        
        return (
            <div className="upload-form row" key={key} style={{'marginTop': '20px'}}>
                <div className="col-md-6 col-sm-12 video-player" style={{'marginTop': '33px'}}>
                    <Player playsInline>
                        <HLSSource
                            isVideoChild
                            src={ VIDEO_THUMBNAIL_URL_PREFIX + file.vit_data.Playlist }
                        />
                        <BigPlayButton position="center" />
                    </Player>
                </div>
                <div className="col-md-6 col-sm-12">
                    <Formsy 
                        onValidSubmit={this.postVideo} 
                        ref="upload_form" 
                        >

                        <div className="col-md-12 col-sm-12 px-0">
                            <TextField 
                                name="title"
                                id="title"
                                label="Title"
                                value={this.state.title}
                                placeholder="" 
                                maxLength={100}
                                required />
                            <small className="text-muted mb-2 d-block" style={{'marginTop': '-5px'}}>100 characters max</small>

                            <CreatableSelect
                                isMulti
                                ref={ ref => { this.creatableRef = ref; }}
                                name="category"
                                classNamePrefix="Select"
                                placeholder="Select some tags" 
                                onKeyDown={this.handleOnKeyDown}
                                onChange={this.handleChangeCategory}
                                options={this.state.categories}
                            />
                            
                            <TextArea 
                                name="description"
                                id="description"
                                placeholder="Type here..." 
                                value={this.state.comment_text}
                            />

                            {/* TODO: Is there any way to post this form without hidden field */}
                            <TextField 
                                name="taskId"
                                id="taskId"
                                value={key}
                                type="hidden"
                                />

                            <button 
                                type="submit"
                                className="btn btn-danger"
                                style={{'marginBottom': '10px'}}
                                disabled={this.state.uploading}
                            >Post</button>
                            <a className="btn" style={{'marginBottom': '10px'}} onClick={() => this.setPreviewPost(key, file, 'remove')}>Cancel</a>
                        </div>
                    </Formsy>    
                </div>
            </div>
        )
    }

    showProgress() {
        // block UI until finishing loading transcoding videos
        if (!this.props.initialized) 
            return (
                <div className="row text-center">
                    <div className="col-12">
                        <i className="fas fa-spinner fa-pulse"></i>
                    </div>
                </div>
            )

        return (
            Object.keys(this.props.uploads).map(key => {
                const file = this.props.uploads[key]
                console.log(file)
                let message;
                switch (file.status) {
                    case UploadStatus.UPLOADING:
                        message = 
                        <div class="row alert alert-warning" key={key}>
                            <div class="col-md-12 col-sm-12">
                                <strong>Uploading progress of {file.original_filename}: {file.progress}%</strong> complete. Do not close/leave this page!
                                <div class="row">
                                    <div class="col-lg-10 col-md-9 col-sm-6">
                                        <Line percent={file.progress} strokeWidth="4" strokeColor="#D3D3D3" />
                                    </div>
                                    <div class="col-lg-2 col-md-3 col-sm-6">
                                        <button className="btn btn-danger btn-sm" onClick={() => this.props.onCancel(key, file)}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        break

                    case UploadStatus.UPLOADED:
                        message = 
                        <div className="alert alert-warning" role="alert" key={key}>
                            <strong>{ file.original_filename } uploaded! Waiting for transcoding!</strong>
                        </div>
                        break;

                    case UploadStatus.TRANSCODING:
                        message = 
                        <div className="row alert alert-warning" key={key}>
                            <div className="col-md-12 col-sm-12">
                                <strong>Trancoding progress of {file.original_filename}: {file.progress}%</strong> complete.
                                <Line percent={file.progress} strokeWidth="4" strokeColor="#D3D3D3" />
                            </div>
                        </div>
                        break

                    case UploadStatus.TRANSCODED:
                        let foundObject = this.state.uploadVideos.find(e => {
                            return e.hasOwnProperty(key);
                        });
                        
                        message = 
                        <div key={key}>
                            {
                                foundObject === undefined ?
                                (
                                    <div className="row alert alert-warning" role="alert" key={key}>
                                        <span>
                                            Trancoding of <strong>{file.original_filename} completed</strong>, it is now <button className="btn btn-primary btn-sm" onClick={() => this.setPreviewPost(key, file, "add")}>ready to post</button>
                                        </span>
                                    </div>
                                ) :
                                (
                                    this.showUploadForm(key, file)
                                )
                                
                            }
                        </div>
                        break
                    
                    case UploadStatus.COMPLETING:
                    case UploadStatus.COMPLETED:
                        message = 
                        <div className={file.status === UploadStatus.COMPLETED ? 'complete-message': ''}>
                            <div className="alert alert-warning" role="alert"> Recently posted {file.original_filename}, please see the 
                                <Link to="/history" target="_blank" className="btn btn-primary btn-sm"> History</Link>
                            </div>
                        </div>
                        break
                        
                    case UploadStatus.CANCELLED:
                        message = 
                        <div className="cancel-message">
                            <div className="alert alert-warning" role="alert" key={key}>
                                <strong>{ file.original_filename } cancelled!</strong>
                            </div>
                        </div>
                        
                        break

                    default:
                        message = 
                        <div className="alert alert-warning" role="alert">
                            <strong>Upload failed!</strong>
                        </div>
                }
                return (
                    <div key={key}>
                        {message}
                    </div>
                )
            })
        )

    }

    showTranscoding() {
        if(!this.state.uploading && this.state.transcoding) {
            return (
                <div className="alert alert-warning mt-4" role="alert">
                    <strong>Transcoding progress:</strong> {this.state.transcode_progress}% complete
                    <Line percent={ this.state.transcode_progress } strokeWidth="4" strokeColor="#D3D3D3" />
                </div>
            )
        }
    }

    handleDropRejected(file) {
        
        toast.error("Error! Cannnot upload this type of file.");

    }

    render() {
        
        return (
            <div className="row justify-content-center">

                <ToastContainer />

                <div className="col-md-10 col-sm-12 mt-4">
                    <div className="upload-wrapper">
                        {/* Upload Area */}
                        <div>
                            <h3 className="mb-4">Upload your content</h3>

                            { this.showProgress() }

                            <Dropzone 
                                    className="dropzone mt-4 w-100 d-flex justify-content-center align-items-center" 
                                    onDropAccepted={ this.handleDrop }
                                    multiple={ true } 
                                    onDropRejected={this.handleDropRejected }
                                    accept="video/mp4, video/avi, video/x-matroska, video/quicktime, video/webm"
                                    disabled={ !this.props.initialized }
                                >
                                    <div className="w-100 text-center">
                                        {
                                            !this.props.initialized ? (
                                                <div>Please wait</div>
                                            ) : (
                                                <div>Drag a file here or click to upload <span className="small d-block">(<strong>1GB max</strong>, MP4, AVI, MKV, MOV <strong>only</strong>)</span></div>
                                            )
                                        }
                                        

                                        {
                                            this.state.files.length > 0 ? (
                                                <small className="d-block text-white text-center mt-2">You are ready to upload <strong>{this.state.files[0].name}</strong></small>
                                            ) : null
                                        }
                                    </div>
                            </Dropzone>
                        </div>
                    </div>
                </div>
            </div>
        )
        
    }

}

function mapStateToProps(state) {

    return { 
        search: state.search,
        app: state.app,
        uploads: state.upload.uploads,
        initialized: state.upload.initialized
    };
    
}

const mapDispatchToProps = (dispatch) => ({
    post,
    onUpload: (upload_backend, formData, headers) => {
        dispatch(uploadRequest(upload_backend, formData, headers))
    },
    onCancel: (id, data) => {
        dispatch(uploadCancel(id, data))
    },
    completeUpload: (id, endpoint, headers) => {
        dispatch(completeUpload(id, endpoint, headers))
    },
    removeUpload: (id) => {
        dispatch(removeUpload(id))
    },
    startTranscodeCheck: (url) => {
        dispatch(startTranscodeCheck(url))
    },
    stopTranscodeCheck: () => {
        dispatch(stopTranscodeCheck())
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(Upload);
