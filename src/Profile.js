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
            upload_success: false,
            suggested_password: '',
            new_password: '',
            updating: false,
            isRule1Checked: false,
            isRule2Checked: false
        };  

        this.upload = this.upload.bind(this);
        this.update = this.update.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.generatePassword = this.generatePassword.bind(this);
        this.updatePassword = this.updatePassword.bind(this);
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);


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

    handleCheckboxChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });

    }

    
    upload() {

        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        var confirmation = prompt("Please enter your VIT password to update your account.", "");

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

                console.log("Avatar upload response", response);

                let avatar_path = "https://media.vit.tube/uploads/" + response.data.Hash + "/" + response.data.Name,
                jsonMetadata = { profile: { profile_image: avatar_path } };

                if(this.state.account.json_metadata.profile && (this.state.account.json_metadata.profile.name || this.state.account.json_metadata.profile.about) ) {
                    jsonMetadata = { profile: { name: this.state.account.json_metadata.profile.name, about: this.state.account.json_metadata.profile.about, profile_image: avatar_path } };
                }

                // get the keys
                let keys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"])
                var self = this;

                console.log("jsonMetadata on Upload", jsonMetadata)

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
                                uploading: false
                            });

                            toast.error('Cannot complete this action. Reason: ' + err.data.message);

                            return;
                        }

                        console.log("Avatar update", result);

                        // get the most recent profile
                        steem.api.getAccounts([self.props.app.username], (err, accounts) => {

                            let account_info = accounts[0];
                            account_info.json_metadata = JSON.parse(accounts[0].json_metadata);

                            self.setState({
                                uploading: false,
                                account: account_info,
                                display_name: (account_info.json_metadata.profile && account_info.json_metadata.profile.name) ? account_info.json_metadata.profile.name : '',
                                about: (account_info.json_metadata.profile && account_info.json_metadata.profile.about) ? account_info.json_metadata.profile.about : '',
                                profile_image: (account_info.json_metadata.profile && account_info.json_metadata.profile.profile_image) ? "https://steemitimages.com/100x100/" + account_info.json_metadata.profile.profile_image : '',
                            })

                        });

                        toast.success("Your new avatar has been uploaded!");

                    }
                );

            }).catch(err => {

                console.log("File err", err)

                toast.error('Something went wrong!');

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

        var confirmation = prompt("Please enter your VIT password to update your account", "");

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
                            saving: false
                        });

                        toast.error('Cannot complete this action. Reason: ' + err.data.message);

                        return;
                    }

                    console.log("Profile update", result);

                    // get the most recent profile
                    steem.api.getAccounts([self.props.app.username], (err, accounts) => {

                        let account_info = accounts[0];
                        account_info.json_metadata = JSON.parse(accounts[0].json_metadata);

                        self.setState({
                            saving: false,
                            account: account_info,
                            display_name: (account_info.json_metadata.profile && account_info.json_metadata.profile.name) ? account_info.json_metadata.profile.name : '',
                            about: (account_info.json_metadata.profile && account_info.json_metadata.profile.about) ? account_info.json_metadata.profile.about : '',
                            profile_image: (account_info.json_metadata.profile && account_info.json_metadata.profile.profile_image) ? "https://steemitimages.com/100x100/" + account_info.json_metadata.profile.profile_image : '',
                        })

                    });

                    toast.success("Your account information has been updated!");

                }
            );
    

        } else {

            toast.error('Please enter your VIT password to complete this action!');

            this.setState({
                saving: false
            });

        }
        
    }

    generatePassword() {

        var password = steem.formatter.createSuggestedPassword();
        this.setState({
            suggested_password: password
        });

    }

    updatePassword(form_data) {


        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        var confirmation = prompt("Please enter your CURRENT VIT password (NOT New Password) to proceed.", "");

        if(confirmation) {

            // get the old keys to sign the transaction
            let oldKeys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"])

            // prep the new keys to update the system with
            let publicKeys = steem.auth.generateKeys(this.props.app.username, form_data.new_password, ['owner', 'active', 'posting', 'memo']),
                owner = { weight_threshold: 1, account_auths: [], key_auths: [[publicKeys.owner, 1]] },
                active = { weight_threshold: 1, account_auths: [], key_auths: [[publicKeys.active, 1]] },
                posting = { weight_threshold: 1, account_auths: [], key_auths: [[publicKeys.posting, 1]] },
                self = this;           

            this.setState({
                updating: true
            });

            steem.broadcast.accountUpdate(
                oldKeys.owner,
                this.props.app.username,
                owner,
                active,
                posting,
                publicKeys.memo,
                '',
                function (err,  result) {

                    console.log(err, result);

                    if(err) {

                        self.setState({
                            updating: false
                        });

                        toast.error('Cannot complete this action. Reason: ' + err.data.message);

                        return false;

                    }

                    // clean up localStorage
                    localStorage.removeItem('username');
                    localStorage.removeItem('publicWif');
                    localStorage.removeItem('postingWif');

                    // logout
                    self.props.history.push("/login");

                }
            );

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
                                        accept="image/jpeg, image/png"
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


                        </div>
                    </div>

                    <div className="upload-wrapper mb-4">

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
                                    maxLength={20}
                                     />


                                <TextField 
                                    name="about"
                                    id="about"
                                    label="About:"
                                    value={this.state.about}
                                    placeholder="Introduce yourself..." 
                                    maxLength={300}
                                     />

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

                    <div className="upload-wrapper mb-4">

                        <h3 className="mb-1">Password</h3>
                        <p className="mb-4 text-muted">Here you can update your password.</p>

                        <button 
                            onClick={this.generatePassword}
                            className="btn btn-danger mb-4" 
                        >Generate New Password</button>

                        <div className="col-8 px-0">

                            <div className="form-group">
                                <label>Suggested Password</label>
                                <input type="text" className="form-control" disabled value={ this.state.suggested_password }/>
                            </div>

                        </div>


                        <Formsy 
                            onValidSubmit={this.updatePassword} 
                            ref="password_form" 
                            >

                            <div className="col-8 px-0">

                                <TextField 
                                    name="new_password"
                                    id="new_password"
                                    label="Enter Suggested Password:"
                                    value={this.state.new_password}
                                    placeholder="" 
                                    memo="Make sure you back it up in a safe place! Alternatively, you can use your own password."
                                    maxLength={100}
                                    required />

                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" name="isRule1Checked" value="" id="rule1" checked={this.state.isRule1Checked} onChange={this.handleCheckboxChange}/>
                                    <label className="form-check-label text-danger" name="rule1" htmlFor="rule1">
                                        I understand that VIT cannot recover lost passwords
                                    </label>
                                </div>

                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" name="isRule2Checked" value="" id="rule2" checked={this.state.isRule2Checked} onChange={this.handleCheckboxChange}/>
                                    <label className="form-check-label text-danger" name="rule2" htmlFor="rule2">
                                        I have securely saved my new password
                                    </label>
                                </div>

                            </div>

                            <button 
                                type="submit"
                                className="btn btn-danger mt-4" 
                                disabled={this.state.updating || !this.state.isRule1Checked || !this.state.isRule2Checked}
                            >Update</button>

                        </Formsy>

                        
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
