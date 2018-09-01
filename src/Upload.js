import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { Link } from 'react-router-dom';
import Dropzone from 'react-dropzone';
// import axios from 'axios';
import { post } from './actions/post';
import Formsy from 'formsy-react';
import TextField from './components/forms/TextField';
import TextArea from './components/forms/TextArea';
import Select from 'react-select';
import './sass/Select.scss';
import { ToastContainer, toast } from 'react-toastify';
import { Line } from 'rc-progress';
import { VIDEO_UPLOAD_ENDPOINT, VIDEO_THUMBNAIL_URL_PREFIX } from './config'
import { uploadRequest, UploadStatus, uploadCancel, startTranscodeCheck, stopTranscodeCheck } from './reducers/upload';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
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
            'ready_to_upload': false,
            'title': '',
            'selected_category': [],
            'categories': [],
            'loading_categories': true,
            'tags': [],
            'selected_tags': [],
            'processing': false,
            'processed': false,
            'progress': null,
            'permlink': '',
            'transcoding': false,
            'transcode_progress': 0,
            'currentPostForm': '',
            'uploadVideos': [],
            'tabIndex': 0 
        }

        this.handleDrop = this.handleDrop.bind(this);
        this.handleDropRejected = this.handleDropRejected.bind(this);
        this.handleChangeCategory = this.handleChangeCategory.bind(this);
        //this.handleChangeTags = this.handleChangeTags.bind(this);
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
        this.props.startTranscodeCheck("https://media.vit.tube/history/" + this.props.app.username)

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

    setPreviewPost(file, type) {
        const key = file.vit_data.Hash;

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
        const hash = form.hash;
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

            // TODO: call URL to updated posted 
            
            // UPDATE state to notify this video is post
            const index = uploadVideos.indexOf(updateObject);
            uploadVideos.splice(index, 1);
            updateObject[hash].post = 'posted';
            this.setState({
                uploadVideos: [...uploadVideos, updateObject],
                permlink: response.payload.operations[0][1].permlink,
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
        });


        
        // II. then update this uploadVideos state as posted in order to display another message
        // const hash = form.hash;
        // const uploadVideos = [...this.state.uploadVideos];
        // const updateObject = uploadVideos.find(e => {
        //     return e.hasOwnProperty(hash);
        // });
        // const index = uploadVideos.indexOf(updateObject);
        // uploadVideos.splice(index, 1);
        // updateObject[hash].post = 'posted';
        // this.setState({
        //     uploadVideos: [...uploadVideos, updateObject]
        // })

    }

    upload(files) {

        // todo: parse tags & cats

        if(!this.props.app.authorized) {
            alert("Not so fast! You have to be looged in to upload your content!");
            return false;
        }

        // let categories = [];
        
        
        /* if(this.state.selected_category.length > 0 ) {
       
            for(var i in this.state.selected_category) {
                if(i < 5) categories.push(this.state.selected_category[i]['value']);
            }
        
        } else {
            toast.error("Please select at least 1 category!");
            return false;
        } */
        

        /* this.setState({
            success: false,
            error: false,
            uploading: true
        }); */

        // get signed signature for Video Upload Authorisation
        const signature = localStorage.getItem("signature");
        const signUserHost = localStorage.getItem("signUserHost");
        

        const headers = {
            'Content-Type': 'multipart/form-data',
            'X-Auth-Token':  signature,
            'X-Auth-UserHost': signUserHost
        }

        let formData = new FormData();
        formData.append('username', this.props.app.username);

        files.forEach(file => {
            formData.append('file', file);
            this.props.onUpload(VIDEO_UPLOAD_ENDPOINT, formData, headers)
        })
        
        /* axios.post(VIDEO_UPLOAD_ENDPOINT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-Auth-Token':  signature,
                'X-Auth-UserHost': signUserHost
            },
            onUploadProgress: (e) => {
              var completed = Math.round((e.loaded * 100) / e.total);
              this.setState({
                progress: completed,
                uploading: completed !== 100
              });
              // console.log("Completed ", completed, e);
            }
        }).then(response => {

            console.log("File upload response", response);

            this.setState({
                success: true,
                processing: true,
                processed: false,
                files: '',
                ready_to_upload: false,
                progress: null
            });

            var self = this;

            if(response.data.url) {
                let redirect_url = response.data.url;
                console.log("redirect_url", redirect_url)

                var refreshInterval = setInterval(function() {

                    axios.get(redirect_url).then(response => {

                        console.log("Is it done yet?", response.data.Complete)

                        if(!response.data.Complete) {

                            self.setState({
                                processing: true,
                                processed: false,
                                transcode_progress: response.data.PercentComplete,
                                transcoding: response.data.PercentComplete > 0 ? true : false,
                            })

                            console.log("Transcode Progress:", response.data.PercentComplete)

                        } else {

                            self.setState({
                                transcode_progress: 100,
                                transcoding: false,
                            })

                            console.log("Done!", response.data)

                            clearInterval(refreshInterval);

                            let slug = form_data.title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

                            self.props.post({

                                postingWif: self.props.app.postingWif, 
                                category: categories[0], // category
                                username: self.props.app.username, 
                                slug: slug, // slug
                                title: form_data.title, // title
                                body: '...', // body,
                                tags: categories,
                                vit_data: response.data

                            }).then( response => {

                                console.log("post blockchain success", response);

                                self.setState({
                                    processing: false,
                                    processed: true,
                                    permlink: response.payload.operations[0][1].permlink,
                                    uploading: false
                                });

                            }).catch(err => {

                                console.log("post error", err)

                                if(err.payload.data && err.payload.data.stack[0].format === '( now - auth.last_root_post ) > STEEMIT_MIN_ROOT_COMMENT_INTERVAL: You may only post once every 5 minutes.') {
                                    
                                    self.setState({
                                        processing: false,
                                        processed: false,
                                        error: true,
                                        error_type: 'timeout',
                                        custom_error_text: 'You may only post once every 5 minutes.',
                                        uploading: false
                                    });

                                } else {

                                    self.setState({
                                        processing: false,
                                        processed: false,
                                        error: true,
                                        error_type: 'other',
                                        uploading: false,
                                        custom_error_text: err.payload.data.stack[0].format
                                    });

                                }

                                

                            });

                        }

                    }).catch(err => {

                        console.log("err GET", response);

                        self.setState({
                            processing: false,
                            processed: false,
                            error: true,
                            error_type: 'generic',
                            uploading: false
                        });
                    });

                }, 2000);

            } else {
                self.setState({
                    processing: false,
                    processed: false,
                    error: true,
                    error_type: 'generic',
                    uploading: false
                });
            }

        }).catch(err => {

            console.log("File err", err)

            this.setState({
                error: true
            });

        }); */
    }

    handleDrop(files) {

        // set uploading in progress

        this.upload(files)

        /* this.setState({
            files: file,
            ready_to_upload: true
        }); */


    }

    handleChangeCategory(category) {

        this.setState({
            selected_category: category
        });
    }

    /*
    handleChangeTags(tags) {

        if( this.state.selected_tags.length < 10 ) {
            this.setState({
                selected_tags: tags
            })
        }
        
    }
    */

    showUploadForm(key, file) {
        
        return (
            <div className="upload-form row" key={key} style={{'marginTop': '20px'}}>
                <div className="col-md-6 col-sm-12 video-player" style={{'marginTop': '33px'}}>
                    <Player playsInline>
                    {/*<PosterImage poster={ "https://media.vit.tube/playback/" +  thumbnail } />*/}
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

                            
                            <Select
                                isMulti
                                name="category"
                                classNamePrefix="Select"
                                placeholder="Select some tags" 
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
                                name="hash"
                                id="hash"
                                value={file.vit_data.Hash}
                                style={{'marginTop': '33px'}}
                                />

                            <button 
                                type="submit"
                                className="btn btn-danger"
                                style={{'marginBottom': '10px'}}
                                // disabled={!this.state.ready_to_upload || this.state.uploading}
                            >Post</button>
                            <a className="btn" style={{'marginBottom': '10px'}} onClick={() => this.setPreviewPost(file, 'remove')}>Cancel</a>
                            
                        </div>
                    </Formsy>    
                </div>
            </div>
        )
    }

    showProgress() {
        return (
            Object.keys(this.props.uploads).map(key => {
                const file = this.props.uploads[key]
                // console.log(file)
                let message;
                switch (file.status) {
                    case UploadStatus.UPLOADING:
                        // message = <span><strong>Uploading, { file.progress }%</strong> complete. Do not close/leave this page! <button onClick={() => this.props.onCancel(key, file)} >Cancel</button></span>
                        message = 
                        <div className="row alert alert-warning" key={key}>
                            <div className="col-md-10 col-sm-12">
                                <strong>Uploading progress: {file.progress}%</strong> complete. Do not close/leave this page!
                                <Line percent={file.progress} strokeWidth="4" strokeColor="#D3D3D3" />
                            </div>
                            <div className="col-md-2 col-sm-12">
                                <button className="btn btn-danger btn-sm progress-cancel" onClick={() => this.props.onCancel(key, file)}>Cancel</button>
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
                            <div className="col-md-10 col-sm-12">
                                <strong>Trancoding progress: {file.progress}%</strong> complete. Do not close/leave this page!
                                <Line percent={file.progress} strokeWidth="4" strokeColor="#D3D3D3" />
                            </div>
                            <div className="col-md-2 col-sm-12">
                                <button className="btn btn-danger btn-sm progress-cancel" onClick={() => this.props.onCancel(key, file)}>Cancel</button>
                            </div>
                        </div>
                        break

                    case UploadStatus.COMPLETED:
                        let foundObject = this.state.uploadVideos.find(e => {
                            return e.hasOwnProperty(file.vit_data.Hash);
                        });
                        message = 
                        <div key={key}>
                            {
                                foundObject === undefined ?
                                (
                                    <div className="row alert alert-warning" role="alert" key={key}>
                                        <span>
                                            Trancoding of <strong>{file.original_filename} completed</strong>, it is now <button className="btn btn-primary btn-sm" onClick={() => this.setPreviewPost(file, "add")}>ready to post</button>
                                        </span>
                                    </div>
                                ) : [
                                    (
                                        foundObject[file.vit_data.Hash].post === 'posted'
                                        ? <div className="alert alert-warning" role="alert" key={key}>Recently posted {file.original_filename}, please see the <button className="btn btn-primary btn-sm" onClick={() => this.setState({tabIndex: 1})}>history</button></div>
                                        : this.showUploadForm(key, file)
                                    )
                                ]
                            }
                        </div>
                        break

                    case UploadStatus.CANCELLED:
                        message = 
                        <div className="alert alert-warning" role="alert" key={key}>
                            <strong>{ file.original_filename } cancelled!</strong>
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

        /* if(this.state.uploading && this.state.progress) {
            return (
                <div className="alert alert-warning mt-4" role="alert">
                    <strong>Uploading, { this.state.progress }%</strong> complete. Do not close/leave this page!
                </div>
            )
        } else if(this.state.success && this.state.processing && !this.state.processed) {

            return (
                <div className="alert alert-warning mt-4" role="alert">
                    <strong>Please stand by!</strong> Your video is currently being processed. Do not close/leave this page!
                </div>
            )


        } else if(this.state.success && !this.state.processing && this.state.processed) {

            return (
                <div className="alert alert-success mt-4" role="alert">
                    <strong>Success!</strong> Your video is now processed and available <strong><Link to={ "/@" + this.props.app.username + "/" + this.state.permlink }>here</Link></strong>
                </div>
            )

        } */

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

    handleErrors() {

        if(this.state.error_type === 'generic') {

            return (
                <span><strong>Error!</strong> Could not upload your file. Please try again!</span>
            )

        } else {

            return (
                <span><strong>Error!</strong> {this.state.custom_error_text }</span>
            )

        }

    }

    handleDropRejected(file) {
        
        toast.error("Error! Cannnot upload this type of file.");

    }

    render() {
        
        return (
            <div className="row justify-content-center">

                {/* <ToastContainer /> */}

                <div className="col-md-10 col-sm-12 mt-4">
                    <div className="upload-wrapper">
                        <Tabs selectedIndex={this.state.tabIndex} onSelect={tabIndex => this.setState({ tabIndex })}>
                            <TabList>
                                <Tab>Upload</Tab>
                                <Tab>History</Tab>
                            </TabList>

                            <TabPanel>
                                {/* Upload Area */}
                                <div>
                                    <h3 className="text-center mb-4">Upload your content</h3>

                                    {/* <Formsy 
                                        onValidSubmit={this.upload} 
                                        ref="upload_form" 
                                        >

                                        <div className="col-md-8 col-sm-12 px-0">

                                            <TextField 
                                                name="title"
                                                id="title"
                                                label="Title"
                                                value={this.state.title}
                                                placeholder="" 
                                                maxLength={100}
                                                required />
                                            <small className="text-muted mb-2 d-block" style={{'marginTop': '-5px'}}>100 characters max</small>

                                            <label>Category</label>
                                            <Select
                                                isMulti
                                                name="category"
                                                classNamePrefix="Select"
                                                onChange={this.handleChangeCategory}
                                                options={this.state.categories}
                                            /> */}

                                            {/*<label className="mt-3">Tags</label>
                                            
                                            <CreatableSelect
                                                isMulti
                                                className="Select"
                                                
                                                onChange={this.handleChangeTags}
                                            />
                                            <small className="text-muted mb-2 d-block" style={{'marginTop': '11px'}}>Up to 10 tags</small>
                                            */}
                                        {/* </div>

                                        {
                                            this.state.error ? (
                                                <div className="alert alert-danger mt-4" role="alert">
                                                    { this.handleErrors() }
                                                </div>
                                            ) : null
                                        }

                                        {
                                            this.state.success || this.state.uploading ? (
                                                <span>
                                                    { this.showProgress() }
                                                </span>
                                            ) : null
                                        }

                                        {
                                            this.state.success || this.state.transcoding ? (
                                                <span>
                                                    { this.showTranscoding() }
                                                </span>
                                            ) : null
                                        }

                                        <Dropzone 
                                            className="dropzone mt-4 w-100 d-flex justify-content-center align-items-center" 
                                            onDrop={ this.handleDrop }
                                            multiple={ false } 
                                            onDropRejected={this.handleDropRejected }
                                            accept="video/mp4, video/avi, video/x-matroska, video/quicktime, video/webm"
                                            disabled={ this.state.uploading }
                                        >
                                            <div className="w-100 text-center">
                                                Drag a file here or click to upload <span className="small d-block">(<strong>1GB max</strong>, MP4, AVI, MKV, MOV <strong>only</strong>)</span>

                                                {
                                                    this.state.files.length > 0 ? (
                                                        <small className="d-block text-white text-center mt-2">You are ready to upload <strong>{this.state.files[0].name}</strong></small>
                                                    ) : null
                                                }
                                            </div>
                                        </Dropzone>

                                        <button 
                                            type="submit"
                                            className="btn btn-danger mt-4" 
                                            // disabled={!this.state.ready_to_upload || this.state.uploading}
                                        >Upload</button>

                                    </Formsy> */}

                                    {/* <div className="alert alert-warning mt-4 col-md-8 col-sm-12" role="alert">
                                        <span>
                                            <strong>Uploading progress: 40%</strong> complete. Do not close/leave this page!
                                            <Line percent="40" strokeWidth="4" strokeColor="#D3D3D3" />
                                            <div>
                                                <button className="btn btn-danger btn-sm progress-cancel">Cancel</button>
                                            </div>
                                        </span>
                                    </div>     */}
                                    

                                    { this.showProgress() }

                                    <Dropzone 
                                            className="dropzone mt-4 w-100 d-flex justify-content-center align-items-center" 
                                            onDropAccepted={ this.handleDrop }
                                            multiple={ true } 
                                            onDropRejected={this.handleDropRejected }
                                            accept="video/mp4, video/avi, video/x-matroska, video/quicktime, video/webm"
                                            disabled={ this.state.uploading }
                                        >
                                            <div className="w-100 text-center">
                                                Drag a file here or click to upload <span className="small d-block">(<strong>1GB max</strong>, MP4, AVI, MKV, MOV <strong>only</strong>)</span>

                                                {
                                                    this.state.files.length > 0 ? (
                                                        <small className="d-block text-white text-center mt-2">You are ready to upload <strong>{this.state.files[0].name}</strong></small>
                                                    ) : null
                                                }
                                            </div>
                                    </Dropzone>
                                </div>
                            </TabPanel>

                            <TabPanel>
                                {/* TODO: the history of user's posted articles */}
                                <h3 className="text-center mb-4">Upload Histories</h3>
                            </TabPanel>
                        </Tabs>
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
        uploads: state.upload.uploads
    };
    
}

const mapDispatchToProps = (dispatch) => ({
    post,
    onUpload: (upload_backend, formData, headers) => {
        dispatch(uploadRequest(upload_backend, formData, headers));
    },
    onCancel: (id, data) => {
        dispatch(uploadCancel(id, data));
    },
    startTranscodeCheck: (url) => {
        dispatch(startTranscodeCheck(url))
    },
    stopTranscodeCheck: () => {
        dispatch(stopTranscodeCheck())
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(Upload);
