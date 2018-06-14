import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Header from './components/Header';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import { post } from './actions/post';
import Formsy from 'formsy-react';
import TextField from './components/forms/TextField';
import Select from 'react-select';
import CreatableSelect from 'react-select/lib/Creatable';
import './sass/Select.scss';

class Upload extends Component {

    constructor(props) {

        super(props);

        this.state = {
            'uploading': false,
            'files': [],
            'error': false,
            'success': false,
            'ready_to_upload': false,
            'uploading': false,
            'title': '',
            'selected_category': [],
            'categories': [],
            'loading_categories': true,
            'tags': [
                { value: 'Tag1', label: 'Tag1' },
                { value: 'Tag2', label: 'Tag2' },
                { value: 'Tag3', label: 'Tag3' }
            ],
            'selected_tags': []
        }

        this.handleDrop = this.handleDrop.bind(this);
        this.handleDropRejected = this.handleDropRejected.bind(this);
        this.handleChangeCategory = this.handleChangeCategory.bind(this);
        this.handleChangeTags = this.handleChangeTags.bind(this);
        this.upload = this.upload.bind(this);

    } 

    componentDidMount() {

        // TODO: change 'life'
        steem.api.getTrendingTags('life', 20, (err, result) => {

            let categories = [];
            for(var i in result) {
                categories.push({ value: result[i]['name'], label: result[i]['name']})
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

        let tags = [],
        category = this.state.selected_category.value;

        if(!category) {
            alert("Please select a category!");
            return false;
        }

        if(this.state.selected_tags.length > 0) {
            for(var i in this.state.selected_tags) {
                tags.push(this.state.selected_tags[i]['value']);
            }
        }

        var slug = form_data.title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

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

            console.log("File upload response", response)

            this.setState({
                success: true,
                files: '',
                ready_to_upload: false
            });

            let slug = form_data.title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

            this.props.post({

                postingWif: this.props.app.postingWif, 
                category: category, // category
                username: this.props.app.username, 
                slug: slug, // slug
                title: form_data.title, // title
                body: '...', // body,
                tags: tags,
                vit_data: response.data

            }).then( response => {

                console.log("post blockchain success", response);

            }).catch(err => {

                console.log("post error", err)

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

    handleChangeCategory(category) {

        this.setState({
            selected_category: category
        })
    }

    handleChangeTags(tags) {

        if( this.state.selected_tags.length < 10 ) {
            this.setState({
                selected_tags: tags
            })
        }
        
    }

    handleDropRejected(file) {
        //console.log("rejected", file)
    }

    render() {
        
        return (
            <div className="row justify-content-center">
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
                                    <small className="text-muted mb-2 d-block" style={{'margin-top': '-5px'}}>100 characters max</small>

                                    <label>Category</label>
                                    <Select
                                        name="category"
                                        className="Select"
                                        onChange={this.handleChangeCategory}
                                        options={this.state.categories}
                                    />

                                    <label className="mt-3">Tags</label>

                                    <CreatableSelect
                                        isMulti
                                        className="Select"
                                        
                                        onChange={this.handleChangeTags}
                                    />
                                    <small className="text-muted mb-2 d-block" style={{'margin-top': '11px'}}>Up to 10 tags</small>
                                </div>

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
                                                <small className="d-block text-white text-center">You are ready to upload <strong>{this.state.files[0].name}</strong></small>
                                            ) : null
                                        }
                                    </div>
                                </Dropzone>

                                <button 
                                    type="submit"
                                    className="btn btn-danger mt-4" 
                                    disabled={!this.state.ready_to_upload}
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
