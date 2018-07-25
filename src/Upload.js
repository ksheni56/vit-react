import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { Link } from 'react-router-dom';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import { post } from './actions/post';
import Formsy from 'formsy-react';
import TextField from './components/forms/TextField';
import Select from 'react-select';
import './sass/Select.scss';
import { ToastContainer, toast } from 'react-toastify';
import { Line } from 'rc-progress';

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
            'transcode_progress': 0
        }

        this.handleDrop = this.handleDrop.bind(this);
        this.handleDropRejected = this.handleDropRejected.bind(this);
        this.handleChangeCategory = this.handleChangeCategory.bind(this);
        //this.handleChangeTags = this.handleChangeTags.bind(this);
        this.upload = this.upload.bind(this);

    } 

    componentDidMount() {

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

    componentWillReceiveProps(nextProps) {    

    }

    upload(form_data) {

        // todo: parse tags & cats

        if(!this.props.app.authorized) {
            alert("Not so fast! You have to be looged in to upload your content!");
            return false;
        }

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
            success: false,
            error: false,
            uploading: true
        });

        let formData = new FormData();
        formData.append('file', this.state.files[0]);
        axios.post("https://media.vit.tube/upload/video", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
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

            if(!response.data.Complete) {
                let redirect_url = response.request.responseURL;
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

            }

        }).catch(err => {

            console.log("File err", err)

            this.setState({
                error: true
            });

        });
    }

    handleDrop(file) {

        this.setState({
            files: file,
            ready_to_upload: true
        });


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

    showProgress() {
        if(this.state.uploading && this.state.progress) {
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

        }

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

                <ToastContainer />

                <div className="col-8 mt-4">
                    <div className="upload-wrapper">
                        <div>

                            <h3 className="text-center mb-4">Upload your content</h3>

                            <Formsy 
                                onValidSubmit={this.upload} 
                                ref="upload_form" 
                                >

                                <div className="col-8 px-0">

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
                                        className="Select"
                                        onChange={this.handleChangeCategory}
                                        options={this.state.categories}
                                    />

                                    {/*<label className="mt-3">Tags</label>
                                    
                                    <CreatableSelect
                                        isMulti
                                        className="Select"
                                        
                                        onChange={this.handleChangeTags}
                                    />
                                    <small className="text-muted mb-2 d-block" style={{'marginTop': '11px'}}>Up to 10 tags</small>
                                    */}
                                </div>

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
                                    accept="video/mp4, video/avi, video/x-matroska, video/quicktime"
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
                                    disabled={!this.state.ready_to_upload || this.state.uploading}
                                >Upload</button>

                            </Formsy>

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
        app: state.app
    };
    
}


export default connect(mapStateToProps, { post })(Upload);
