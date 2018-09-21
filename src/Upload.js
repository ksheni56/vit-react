import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import Dropzone from 'react-dropzone';
import { Link } from 'react-router-dom';
import { post } from './actions/post';
import axios from 'axios';
import Formsy from 'formsy-react';
import TextField from './components/forms/TextField';
import TextArea from './components/forms/TextArea';
import CreatableSelect from 'react-select/lib/Creatable';
import './sass/Select.scss';
import { ToastContainer, toast } from 'react-toastify';
import { Line } from 'rc-progress';
import { VIDEO_UPLOAD_ENDPOINT, VIDEO_THUMBNAIL_URL_PREFIX, VIDEO_HISTORY_ENDPOINT, AVATAR_UPLOAD_ENDPOINT, SCREENSHOT_IMAGE, VIDEO_UPLOAD_POSTED_ENDPOINT } from './config'
import { uploadRequest, UploadStatus, uploadCancel, startTranscodeCheck, stopTranscodeCheck, completeUpload, removeUpload } from './reducers/upload';
import HLSSource from './HLS';
import { Player, BigPlayButton } from 'video-react';
import BlockUi from 'react-block-ui';
import 'react-block-ui/style.css';

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
        this.handleThumnailScreenShot = this.handleThumnailScreenShot.bind(this);
        this.b64toBlob = this.b64toBlob.bind(this);
        this.handleDropThumbnail = this.handleDropThumbnail.bind(this);
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
                    uploadVideos: [...this.state.uploadVideos, {[key]: {'post': '', 'file': file, 'videoThumbnail': '', 'thumbnailType': ''} }]
                });
            } else {
                let foundObject = this.state.uploadVideos.find(e => {
                    return e.hasOwnProperty(key);
                });

                if (!foundObject || foundObject === undefined) {
                    this.setState({
                        uploadVideos: [...this.state.uploadVideos, {[key]: {'post': '', 'file': file, 'videoThumbnail': '', 'thumbnailType': ''} }]
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

    b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    postVideo(form) {
        const hash = form.taskId;
        const uploadVideos = [...this.state.uploadVideos];
        const updateObject = uploadVideos.find(e => {
            return e.hasOwnProperty(hash);
        });

        let vit_data = updateObject[hash].file.vit_data;
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
        if(!updateObject.videoThumbnail) {
            toast.error("Please take a screenshot!");
            return false;
        }

        categories.push('touch-tube');

        // post video thumnail, then return the IPFS hash store into metajson
        let videoBlob;
        const videoThumbnail = updateObject.videoThumbnail;
        const thumbnailType = updateObject.thumbnailType;
        if (thumbnailType === 0) {
            // capture screenshot, so we need to convert to blob data
            const block = videoThumbnail.split(";");
            const contentType = block[0].split(":")[1];
            const realData = block[1].split(",")[1];
            videoBlob = this.b64toBlob(realData, contentType);
        } else {
            videoBlob = videoThumbnail;
        }

        let formData = new FormData();
        formData.append('file', videoBlob, SCREENSHOT_IMAGE);

        // Start to upload post process
        this.setState({
            error: false,
            uploading: true
        });

        axios.post(AVATAR_UPLOAD_ENDPOINT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-Auth-Token':  localStorage.getItem("signature"),
                'X-Auth-UserHost': localStorage.getItem("signUserHost")
            }
        }).then(res => {
            console.log("Upload video thumnail", res);
            // get return video thumbnail screenshot
            vit_data = {...vit_data, 'Screenshot': res.data.Hash};
            var self = this;

            // post to block chain
            this.props.post({
                postingWif: this.props.app.postingWif, 
                category: categories[0].replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(), // category
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
    
                self.props.completeUpload(hash, VIDEO_UPLOAD_POSTED_ENDPOINT + hash, headers)
    
                self.setState({
                    uploading: false
                })
    
            }).catch(err => {
                console.log("post error", err);
    
                if(err.payload.data && err.payload.data.stack[0].format === '( now - auth.last_root_post ) > STEEMIT_MIN_ROOT_COMMENT_INTERVAL: You may only post once every 5 minutes.') {
                    self.setState({
                        error: true,
                        error_type: 'timeout',
                        custom_error_text: 'You may only post once every 5 minutes.',
                        uploading: false
                    });
                } else {
                    self.setState({
                        error: true,
                        error_type: 'other',
                        uploading: false,
                        custom_error_text: err.payload.data.stack[0].format
                    });
                }
    
                toast.error(self.state.custom_error_text);
            });

        }).catch(err => {
            console.log("Something's wrong", err);
            this.setState({
                error: true,
                error_type: 'other',
                uploading: false,
            });

            toast.error('Something went wrong!');
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
            //case ' ':
            case ',':
                this.creatableRef.select.select.selectOption(
                    this.creatableRef.select.select.state.focusedOption
                    //Grab the last element in the list ('Create...')
                    //this.creatableRef.select.select.state.menuOptions.focusable.slice(-1)[0]
                );
        }
    }

    handleInputChange = (newValue) => {
        // Filter out whitespace and commas
        const inputValue = newValue.replace(/[^a-zA-Z0-9-_ ]/g, '');
        //const inputValue = newValue.replace(/[,]/g, '');
        return inputValue;
    }

    handleChangeCategory(category) {
        this.setState({
            selected_category: category
        });
    }

    handleDropThumbnail(accepted, rejected, key) {
        this.handleThumnailScreenShot(key, accepted[0]);
    }

    handleThumnailScreenShot(key, file = '') {
        // draw a video thumbnail
        const videoElement = this.refs['video_' + key].video.video;
        const canvasElement = this.refs['canvas_' + key]
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        const context = canvasElement.getContext('2d');
        let thumbnailType;
        let videoThumbnailURL;
        if (file !== '') { // drop file
            let base_image = new Image();
            base_image.src = file.preview;
            base_image.onload = function(){
                context.drawImage(base_image, 0, 0, canvasElement.width, canvasElement.height);
            };
            videoThumbnailURL = file;
            thumbnailType = 1; 
        } else { // click capture button
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            videoThumbnailURL = canvasElement.toDataURL();
            thumbnailType = 0;
        }
        
        // update videoThumbnail which is used later on for posting 
        const uploadVideos = [...this.state.uploadVideos];
        const foundObject = uploadVideos.find(e => {
            return e.hasOwnProperty(key);
        });

        const index = uploadVideos.indexOf(foundObject);
        uploadVideos.splice(index, 1);
        foundObject.videoThumbnail = videoThumbnailURL;
        foundObject.thumbnailType = thumbnailType;
        
        this.setState({
            uploadVideos: [...uploadVideos, foundObject]
        });
    }

    showUploadForm(key, file) {
        
        let foundObject = this.state.uploadVideos.find(e => {
            return e.hasOwnProperty(key);
        });

        return (
            <BlockUi tag="div" blocking={this.state.uploading} key={key}>
            <div className="upload-form row" key={key} style={{'marginTop': '20px'}}>
                <div className="col-md-6 col-sm-12 video-player" style={{'marginTop': '33px'}}>
                    <Player ref={'video_' + key} playsInline videoId={'video_' + key}>
                        <HLSSource
                            isVideoChild
                            src={ VIDEO_THUMBNAIL_URL_PREFIX + file.vit_data.Playlist }
                        />
                        <BigPlayButton position="center" />
                    </Player>

                    <div style={{'textAlign': 'center', 'marginTop': '10px', 'marginBottom': '10px'}}>

                        <button className="btn btn-info btn-sm" onClick={() => this.handleThumnailScreenShot(key)}>Capture</button>        
                        <Dropzone
                            ref={'dropzone_' + key}
                            className="dropzone-thumbnail" 
                            accept="image/jpeg, image/png"
                            onDrop={(accepted, rejected) => this.handleDropThumbnail(accepted, rejected, key)}
                            multiple={ false }     
                            >
                            
                            <div className="w-100 text-center">
                                <div>Click on Capture button or drag a file here to upload your own video thumbnail<span className="small d-block">(<strong>15MB max</strong>, JPEG or PNG<strong> only</strong>)</span></div>
                            </div>
                        </Dropzone>

                        {
                            foundObject.videoThumbnail === undefined ?
                            (
                                <canvas ref={'canvas_' + key} style={{'height': 0}}></canvas>
                            ) : (
                                <canvas ref={'canvas_' + key} style={{'maxWidth': '100%', 'maxHeight': '100%', 'marginTop': '1em', 'marginBottom': '1em'}}></canvas>
                            )
                        }
                        
                    </div>
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
                                onInputChange={this.handleInputChange}
                            />
                            
                            <TextArea 
                                name="description"
                                id="description"
                                placeholder="Type here..." 
                                value={this.state.comment_text}
                                required
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
            </BlockUi>
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
                        <div className="row alert alert-warning" key={key}>
                            <div className="col-md-12 col-sm-12">
                                <strong>Uploading progress of {file.original_filename}: {file.progress}%</strong> complete. Do not close/leave this page!
                                <div className="row">
                                    <div className="col-lg-10 col-md-9 col-sm-6">
                                        <Line percent={file.progress} strokeWidth="4" strokeColor="#D3D3D3" />
                                    </div>
                                    <div className="col-lg-2 col-md-3 col-sm-6">
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
