import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Header from './components/Header';
import Dropzone from 'react-dropzone';
import axios from 'axios';

class Upload extends Component {

    constructor(props) {

        super(props);

        this.state = {
            'uploading': false,
            'files': [],
            'error': false,
            'success': false,
            'ready_to_upload': false,
            'uploading': false
        }

        this.handleDrop = this.handleDrop.bind(this);
        this.handleDropRejected = this.handleDropRejected.bind(this);
        this.upload = this.upload.bind(this);

    } 

    componentDidMount() {

        

    }

    componentWillReceiveProps(nextProps) {    

    }

    upload() {

        if(!this.props.app.authorized) {
            alert("Not so fast! You have to be looged in to upload your content!");
            return false;
        }

        this.setState({
            success: false,
            error: false
        });

        let formData = new FormData();
        formData.append('file', this.state.files[0]);
        axios.post("http://138.197.166.131:5000", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(response => {

            console.log("File response", response)

            this.setState({
                success: true,
                files: '',
                ready_to_upload: false
            });

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

    handleDropRejected(file) {
        console.log("rejected", file)
    }

    render() {
        
        return (
            <div className="row justify-content-center">
                <div className="col-8 mt-4">
                    <div className="upload-wrapper">
                        <div className="text-center">
                            <h3>Upload your content</h3>

                            {
                                this.state.error ? (
                                    <div className="alert alert-danger mt-4" role="alert">
                                        <strong>Error!</strong> Something went wrong. Please try again!
                                    </div>
                                ) : null
                            }

                            {
                                this.state.success ? (
                                    <div className="alert alert-success mt-4" role="alert">
                                        <strong>Success!</strong> Your video is currently being processed.
                                    </div>
                                ) : null
                            }

                            
                            <Dropzone 
                                className="dropzone mt-4 w-100 d-flex justify-content-center align-items-center" 
                                onDrop={ this.handleDrop }
                                multiple={ false } 
                                onDropRejected={this.handleDropRejected }
                            >
                                <div>
                                    Drag a file here or click to upload.

                                    {
                                        this.state.files.length > 0 ? (
                                            <small className="d-block text-white">You are ready to upload <strong>{this.state.files[0].name}</strong></small>
                                        ) : null
                                    }
                                </div>
                            </Dropzone>

                            <button 
                                onClick={this.upload}
                                className="btn btn-danger mt-4" 
                                disabled={!this.state.ready_to_upload}
                            >Upload!</button>

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


export default connect(mapStateToProps, {})(Upload);
