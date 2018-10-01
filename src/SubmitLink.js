import React from 'react'
import { connect } from 'react-redux'
import steem from '@steemit/steem-js';
import { post } from './actions/post';
import Formsy, { addValidationRule } from 'formsy-react'
import TextField from './components/forms/TextField'
import TextArea from './components/forms/TextArea'
import axios from 'axios'
import { VIDEO_LINK_EMBEDED_CODE_PARSER } from './config'
import { ToastContainer, toast } from 'react-toastify'
import CreatableSelect from 'react-select/lib/Creatable'

addValidationRule('isVideoLink', function (values, value) {
    return value.startsWith('http://') || value.startsWith('https://')
});

class SubmitLink extends React.Component {

    constructor(props) {
        super(props)

        this.state = this.getInitialState()

        this.onSubmit = this.onSubmit.bind(this)
        this.retrieveEmbeddedCode = this.retrieveEmbeddedCode.bind(this)
        this.handleChangeCategory = this.handleChangeCategory.bind(this)
        this.handleOnKeyDown = this.handleOnKeyDown.bind(this)
        this.onLinkChanged = this.onLinkChanged.bind(this)
    }

    getInitialState() {
        return {
            link: '',
            title: '',
            description: '',
            parsing: false,
            posting: false,
            clearing: false,
            linkChanged: false,
            selected_category: [],
            categories: [],
            loading_categories: true,
            embedded_data: null
        }
    }

    componentDidMount() {

        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

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

    onSubmit (form) {
        if (this.state.embedded_data === null) {
            this.retrieveEmbeddedCode (form)
        } else {
            this.post(form)
        }
    }

    onLinkChanged() {
        this.setState({
            linkChanged: true,
        })
    }

    onClear () {
        this.setState({
            clearing: true
        })

        setTimeout(() => {
            this.setState({
                clearing: false,
                embedded_data: null,
                title: '',
                link: ''
            })

            this.refs.upload_form.reset();
        }, 1050)
    }

    retrieveEmbeddedCode(form) {
        this.setState({
            parsing: true
        })
        const signature = localStorage.getItem("signature");
        const signUserHost = localStorage.getItem("signUserHost");

        const headers = {
            'Content-Type': 'multipart/form-data',
            'X-Auth-Token':  signature,
            'X-Auth-UserHost': signUserHost
        }

        const endpoint = VIDEO_LINK_EMBEDED_CODE_PARSER + encodeURI(form.link)
        axios.get(endpoint, {
            headers: headers
            })
            .then(response => {
                if (response.status === 200) {
                    this.setState({
                        embedded_data: response.data,
                        title: response.data.title,
                        description: response.data.description,
                        parsing: false
                    })
                } else {
                    toast.error("Cannot parse your video link or the site is not supported, please try another link")
                    this.setState({
                        embedded_data: null,
                        parsing: false,
                        linkChanged: false
                    })
                }
            })
            .catch(e => {
                toast.error("Cannot parse your video link or the site is not supported, please try another link")
                    this.setState({
                        embedded_data: null,
                        parsing: false,
                        linkChanged: false
                    })
            })
    }

    post(form) {
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
        categories.push('touch-tube');

        // Set parameters before posting
        this.setState({
            posting: true
        });

        // do posting
        this.props.post({
            postingWif: this.props.app.postingWif, 
            category: categories[0].replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(), // category
            username: this.props.app.username, 
            slug: slug, // slug
            title: form.title, // title
            body: form.description, // body,
            tags: categories,
            vit_data: this.state.embedded_data
        }).then( response => {
            console.log("posting blockchain succeeded", response);
            this.setState({
                posting: false
            })
            toast.info("Your link has been posted.")

            this.onClear()
        }).catch(err => {
            console.log("posting error", err)
            let message = "There's an error while posting your link."
            
            if (err.payload.data) {
                if (err.payload.data.stack[0].format === '( now - auth.last_root_post ) > STEEMIT_MIN_ROOT_COMMENT_INTERVAL: You may only post once every 5 minutes.')
                    message = 'You may only post once every 5 minutes.'
                else if (err.payload.data.stack[0].format === 'The comment is archived')
                    message = 'This title is posted. Please change to another title or video link.'
            }

            this.setState({
                posting: false
            });

            toast.error(message)
        });
    }

    handleOnKeyDown = (event) => {
        switch(event.key) {
            case ',':
                this.creatableRef.select.select.selectOption(
                    this.creatableRef.select.select.state.focusedOption
                    //Grab the last element in the list ('Create...')
                )
                break

            default:
        }
    }

    handleInputChange = (newValue) => {
        // Filter out whitespace and commas
        const inputValue = newValue.replace(/[^a-zA-Z0-9-_ ]/g, '');
        return inputValue;
    }

    handleChangeCategory(category) {
        this.setState({
            selected_category: category
        });
    }

    render() {
        
        return (
            <div className="row justify-content-center">
                <ToastContainer />

                <div className="col-md-10 col-sm-12 mt-4">
                    <div className="upload-wrapper">
                        <div>
                            <h3 className="mb-4">Post a video link</h3>

                            <Formsy
                                onValidSubmit={this.onSubmit} 
                                ref="upload_form">

                                <TextField 
                                    name="link"
                                    id="link"
                                    label="Link"
                                    value={this.state.link}
                                    placeholder="https://www.example.com/?v=123456"
                                    disabled={this.state.embedded_data != null || this.setState.posting || this.state.parsing}
                                    validations="isUrl,isVideoLink"
                                    onChange={this.onLinkChanged}
                                    validationError="Please input valid video link"
                                    required />

                                {   this.state.embedded_data !== null ?
                                    <div className={"row " + (this.state.clearing ? "collapse-form" : "expand-form")}>
                                        <div className="text-center col-12 col-lg-6 float-lg-right order-lg-last">
                                            <div className="embedded-video-container" style={{ paddingTop: (this.state.embedded_data !== undefined ? (100*this.state.embedded_data.height/this.state.embedded_data.width + '%') : 'inherit') }}>
                                                <iframe tabIndex="-1"
                                                    title={this.state.embedded_data.provider_name} 
                                                    className="embedded-video" allow="fullscreen" 
                                                    allowFullScreen
                                                    src={this.state.embedded_data.embedded_url} 
                                                    border="0" scrolling="no"
                                                    height='100%' width='100%'></iframe>
                                            </div>
                                        </div>

                                        <div className="col-12 col-lg-6 float-lg-left order-lg-first">
                                            <TextField
                                                name="title"
                                                id="title"
                                                label="Title"
                                                value={this.state.title}
                                                required
                                            />
                                            <div className="form-group">
                                                <label>Tags</label>
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
                                            </div>
                                            <TextArea
                                                name="description"
                                                id="description"
                                                label="Description"
                                                value={this.state.description}
                                                required
                                            />
                                        </div>
                                    </div>
                                    : null
                                }

                                <button 
                                    type="submit"
                                    className="btn btn-danger"
                                    disabled={this.state.parsing || this.state.posting || this.state.clearing || !this.state.linkChanged}>
                                    { this.state.parsing ? 'Parsing...' : ( this.state.embedded_data === null ? 'Next' : (this.state.posting ? 'Posting' : 'Post'))}
                                </button>
                                {
                                    (this.state.embedded_data !== null) ?
                                    <button type="button" disabled={this.state.parsing || this.state.posting || this.state.clearing} className="ml-2 btn btn-secondary" onClick={() => this.onClear()}>
                                        {this.state.clearing ? 'Clearing...' : 'Clear'}
                                    </button>
                                    : null
                                }
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
        app: state.app
    };
}

export default connect(mapStateToProps, {post})(SubmitLink);
