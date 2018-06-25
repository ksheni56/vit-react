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

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//P5JhSgMrKbzfivPVPWqHeCZmZuKeXrLCUFXCVZUdyJyqgTKVM4J6

class Profile extends Component {

    constructor(props) {

        super(props);

        this.state = {
            account: '',
            loading: true,
            saving: false,
            uploading: false,
            display_name: '',
            about: '',
            profile_image: '',
            error_text: 'Something went wrong',
            success: false,
            error: false,
            files: [],
            ready_to_upload: false,
            upload_error_text: 'Something went wrong',
            upload_error: false,
            upload_success: false
        };  

        this.upload = this.upload.bind(this);
        this.update = this.update.bind(this);
        this.handleDrop = this.handleDrop.bind(this);


    } 

    componentWillMount() {

        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }


        steem.api.getAccounts([this.props.app.username], (err, accounts) => {

            if(err || (accounts && accounts.length == 0)) {
                
                console.log("Invalid account!");

                return false; // Handle invalid account

            }

            let account_info = accounts[0];
            account_info.json_metadata = JSON.parse(accounts[0].json_metadata);

            console.log("Account has been loaded", account_info);
            

            // "https://steemitimages.com/100x100/" +  
            this.setState({
                loading: false,
                account: account_info,
                display_name: (account_info.json_metadata.profile && account_info.json_metadata.profile.name) ? account_info.json_metadata.profile.name : '',
                about: (account_info.json_metadata.profile && account_info.json_metadata.profile.about) ? account_info.json_metadata.profile.about : '',
                profile_image: (account_info.json_metadata.profile && account_info.json_metadata.profile.profile_image) ? "https://steemitimages.com/100x100/" + account_info.json_metadata.profile.profile_image : '',
            })

        });
    }

    
    upload() {

        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        var confirmation = prompt("Please enter your VIT password to confirm this transaction", "");

        if(confirmation) {

            this.setState({
                uploading: true
            })

            let formData = new FormData();
            formData.append('file', this.state.files[0]);
            axios.post("http://138.197.166.131:5000", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }).then(response => {

                console.log("Avatar upload response", response)
                let avatar_path = "http://images.vit.tube/uploads/" + response.data.Hash + "/" + response.data.Name;

                let jsonMetadata = { profile: { profile_image: avatar_path } };

                if(this.state.account.json_metadata.profile && (this.state.account.json_metadata.profile.name || this.state.account.json_metadata.profile.about) ) {
                    jsonMetadata = { profile: { name: this.state.account.json_metadata.profile.name, about: this.state.account.json_metadata.profile.about, profile_image: avatar_path } };
                }

                // get the keys
                let keys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"])

                var self = this;

                steem.broadcast.accountUpdate(
                    keys.active,
                    this.props.app.username,
                    undefined, // Set to undefined so account authority dont change
                    undefined,
                    undefined,
                    keys.memoPubkey, // memoPubkey
                    jsonMetadata,
                    function (err,  result) {

                        if(err) {
                            console.log(err)
                            self.setState({
                                upload_error_text: 'Cannot complete this action. Reason: ' + err.data.message,
                                upload_error: true,
                                upload_success: false,
                                uploading: false
                            });

                            return;
                        }

                        console.log("Avatar update", result);

                        self.setState({
                            upload_error: false,
                            uploading: false
                        });

                        toast.success("Your new avatar has been uploaded!");

                    }
                );

            }).catch(err => {

                console.log("File err", err)

                this.setState({
                    error: true
                });

            });

        }

    }

    handleDrop(file) {

        this.setState({
            files: file,
            ready_to_upload: true,
            profile_image: file[0].preview
        });


    }

    update(form_data) {

        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        var confirmation = prompt("Please enter your VIT password to confirm this transaction", "");

        this.setState({
            error_text: 'Something went wrong',
            error: false,
            saving: true,
            success: false
        });

        if(confirmation) {

            // get the keys
            let keys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"])

            // prep the object
            let jsonMetadata = { profile: { name: form_data.name, about: form_data.about } };

            if(this.state.account.json_metadata.profile && this.state.account.json_metadata.profile.profile_image) {
                jsonMetadata = { profile: { name: form_data.name, about: form_data.about, profile_image: this.state.account.json_metadata.profile.profile_image } };
            }
            
            var self = this;

            steem.broadcast.accountUpdate(
                keys.active,
                this.props.app.username,
                undefined, // Set to undefined so account authority dont change
                undefined,
                undefined,
                keys.memoPubkey, // memoPubkey
                jsonMetadata,
                function (err,  result) {

                    if(err) {
                        console.log(err)
                        self.setState({
                            error_text: 'Cannot complete this action. Reason: ' + err.data.message,
                            error: true,
                            success: false,
                            saving: false
                        });

                        return;
                    }

                    console.log("Profile update", result);

                    self.setState({
                        error: false,
                        saving: false
                    });

                    toast.success("Your account information has been updated!");

                }
            );
    

        } else {
            this.setState({
                error_text: 'Please enter your VIT password to complete this action.',
                error: true,
                success: false,
                saving: false
            });
        }
        
    }

    renderAvatar() {
        if(this.state.profile_image != '' ) {
            return (
                <div className="avatar">
                    <img src={ this.state.profile_image }/>
                </div>
            )
        } else if( (this.state.account.json_metadata.profile && !this.state.account.json_metadata.profile.profile_image) || !this.state.account.json_metadata.profile ) {
            return (
               <div className="avatar d-flex justify-content-center align-items-center">
                    <span>+</span>
               </div>
            )
        }
    }

    render() {
        
        return (
            <div className="row justify-content-center">

                <ToastContainer />

                <div className="col-8 mt-4">

                    <div className="upload-wrapper mb-4">
                        <div>

                            <h3 className="mb-1">Your Avatar</h3>

                            {
                                !this.state.loading ? (
                                     <Dropzone 
                                        className="dropzone-avatar" 
                                        onDrop={ this.handleDrop }
                                        multiple={ false }     
                                    >
                                        {this.renderAvatar()}
                                    </Dropzone>
                                ) : null
                            }


                            <div></div>

                            <button 
                                onClick={this.upload}
                                className="btn btn-danger mt-4" 
                                disabled={!this.state.ready_to_upload || this.state.uploading}
                            >Upload</button>

                            {
                                this.state.upload_error ? (
                                    <div className="alert alert-danger mt-4" role="alert">
                                        <strong>Error!</strong> { this.state.upload_error_text }
                                    </div>
                                ) : null
                            }

                        </div>
                    </div>

                    <div className="upload-wrapper mb-4">

                        <div>

                            <h3 className="mb-1">Your Account Info</h3>
                            <p className="mb-4 text-muted">Change your personal information.</p>

                            <Formsy 
                                onValidSubmit={this.update} 
                                ref="powerup_form" 
                                >

                                <div className="col-8 px-0">

                                    <TextField 
                                        name="name"
                                        id="name"
                                        label="Display Name:"
                                        value={this.state.display_name}
                                        placeholder="eg. Joe" 
                                        maxLength={100}
                                        required />


                                    <TextField 
                                        name="about"
                                        id="about"
                                        label="About:"
                                        value={this.state.about}
                                        placeholder="Introduce yourself..." 
                                        maxLength={300}
                                        required />

                                </div>
                                
                               

                                <button 
                                    type="submit"
                                    className="btn btn-danger mt-2" 
                                    disabled={this.state.saving}
                                >Save</button>

                                {
                                    this.state.error ? (
                                        <div className="alert alert-danger mt-4" role="alert">
                                            <strong>Error!</strong> { this.state.error_text }
                                        </div>
                                    ) : null
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
        search: state.search,
        app: state.app
    };
    
}


export default connect(mapStateToProps, { post })(Profile);
