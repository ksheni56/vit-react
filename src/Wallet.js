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

class Wallet extends Component {

    constructor(props) {

        super(props);

        this.state = {
            transfer_success: false,
            transfer_error: false,
            error_text: '',
            transferring: false,
            loading: true,
            account: '',
            to: '',
            amount: '',
            memo: '',
            kets: '',
            power_to: this.props.app.username,
            power_amount: '',
            power_error_text: '',
            power_error: false,
            power_success:false,
            powering: false
        };

        this.transfer = this.transfer.bind(this);
        this.displayKeys = this.displayKeys.bind(this);
        this.powerUp = this.powerUp.bind(this);


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
            this.setState({
                loading: false,
                account: account_info
            })


        });
    }

    displayKeys() {
        var confirmation = prompt("Please enter your VIT password to confirm this action", "");
        if(confirmation) {

            let keys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"]);
            this.setState({
                keys: keys
            })
        } else {
            // maybe next time
        }
    }

    powerUp(form_data) {

        // use owner key

        this.setState({
            power_error_text: 'Something went wrong',
            power_error: false,
            powering: true,
            power_success: false
        });

        let amount = form_data.power_amount + " TVIT",
        confirmation = prompt("Please enter your VIT password to confirm this action", "");

        console.log("form_data", form_data)

         if(confirmation) {

            let keys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"])

            steem.broadcast.transferToVesting(keys.owner, this.props.app.username, form_data.power_to, amount, (err, result) => {

                console.log(err, result)

                if(err) {

                    this.setState({
                        power_error_text: 'Cannot complete this transaction. Reason: ' + err.data.message,
                        power_error: true,
                        powering: false,
                        power_success: false
                    });

                    return;
                }

                this.setState({
                    power_success: true,
                    powering: false
                });

                // Update balance

                steem.api.getAccounts([this.props.app.username], (err, accounts) => {

                    let account_info = accounts[0];
                    account_info.json_metadata = JSON.parse(accounts[0].json_metadata);

                    console.log("Account has been loaded", account_info);
                    this.setState({
                        account: account_info
                    })


                });

            });

        }

    }


    transfer(form_data) {

        var confirmation = prompt("Please enter your VIT password to confirm this transaction", "");

        this.setState({
            error_text: 'Something went wrong',
            transfer_error: false,
            transferring: true
        });

        if(confirmation) {
            // try and send the funds

            let amount = form_data.amount + " TVIT",
            keys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"])

            steem.broadcast.transfer(keys.active, this.props.app.username, form_data.to, amount, form_data.memo, (err, result) => {
                if(err) {
                    console.log(err)
                    this.setState({
                        error_text: 'Cannot complete this transaction. Reason: ' + err.data.message,
                        transfer_error: true,
                        transfer_success: false,
                        transferring: false
                    });

                    return;
                }

                console.log("Transfer results", result);

                this.setState({
                    transfer_success: true,
                    transferring: false
                });

                // Update balance

                steem.api.getAccounts([this.props.app.username], (err, accounts) => {

                    let account_info = accounts[0];
                    account_info.json_metadata = JSON.parse(accounts[0].json_metadata);

                    console.log("Account has been loaded", account_info);
                    this.setState({
                        account: account_info
                    })


                });

            });

        } else {
            this.setState({
                error_text: 'Please enter your VIT password to complete this transaction.',
                transfer_error: true,
                transferring: false
            });
        }
        
    }

    render() {
        
        return (
            <div className="row justify-content-center">
                <div className="col-8 mt-4">

                    <div className="upload-wrapper mb-4">
                        <div>

                            {
                                this.state.loadung ? (
                                    <h3>Loading your balance...</h3>
                                ) : (
                                    <div>
                                        <h3 className="mb-2">Your VIT Balance: <span className="text-danger">{ this.state.account.balance }</span></h3>
                                        <h3 className="mb-2">Your VBD Balance: <span className="text-danger">{ this.state.account.sbd_balance }</span></h3>
                                        <h3 className="">Your VESTS Balance: <span className="text-danger">{ this.state.account.delegated_vesting_shares }</span></h3>
                                    </div>
                                )
                            }

                        </div>
                    </div>

                    <div className="upload-wrapper mb-4">
                        <div>

                            <h3 className="mb-1">Trasnfer Your Funds</h3>
                            <p className="mb-4 text-muted">Move funds to another VIT account.</p>

                            <Formsy 
                                onValidSubmit={this.transfer} 
                                ref="upload_form" 
                                >

                                <div className="col-8 px-0">

                                    <TextField 
                                        name="to"
                                        id="to"
                                        label="To:"
                                        value={this.state.to}
                                        placeholder="Enter VIT username" 
                                        maxLength={100}
                                        required />


                                    <TextField 
                                        name="amount"
                                        id="amount"
                                        label="Amount:"
                                        value={this.state.amount}
                                        placeholder="Enter amount"
                                        validations={{
                                            matchRegexp: /^[0-9]+\.[0-9]{3,3}$/
                                        }}
                                        validationErrors={{
                                            matchRegexp: 'Incorrect amount. Please enter X.YYY. eg. 1.000 or 0.005',
                                        }} 
                                        required />

                                    <TextField 
                                        name="memo"
                                        id="memo"
                                        label="Memo:"
                                        value={this.state.memo}
                                        placeholder="This memo is public" 
                                        maxLength={200}
                                    />

                                    <small className="mb-2 d-none" style={{'marginTop': '-5px'}}><a href="#" className="text-danger">Transfer all balance</a></small>
                                    

                                </div>
                                {
                                    this.state.transfer_error ? (
                                        <div className="alert alert-danger mt-4" role="alert">
                                            <strong>Error!</strong> { this.state.error_text }
                                        </div>
                                    ) : null
                                }

                                {
                                    this.state.transfer_success ? (
                                        <div className="alert alert-success mt-4" role="alert">
                                            <strong>Success!</strong> Your transaction is now completed.
                                        </div>
                                    ) : null
                                }
                               

                                <button 
                                    type="submit"
                                    className="btn btn-danger mt-2" 
                                    disabled={this.state.transferring}
                                >Trasnfer</button>

                            </Formsy>

                        </div>
                    </div>

                    <div className="upload-wrapper mb-4">

                        <div>

                            <h3 className="mb-1">Power Up</h3>
                            <p className="mb-4 text-muted">Influence tokens which give you more control over post payouts and allow you to earn on curation rewards.</p>

                            <Formsy 
                                onValidSubmit={this.powerUp} 
                                ref="powerup_form" 
                                >

                                <div className="col-8 px-0">

                                    <TextField 
                                        name="power_to"
                                        id="power_to"
                                        label="To:"
                                        value={this.state.power_to}
                                        placeholder="Enter VIT username" 
                                        maxLength={100}
                                        required />


                                    <TextField 
                                        name="power_amount"
                                        id="power_amount"
                                        label="Amount:"
                                        value={this.state.power_amount}
                                        placeholder="Enter amount"
                                        validations={{
                                            matchRegexp: /^[0-9]+\.[0-9]{3,3}$/
                                        }}
                                        validationErrors={{
                                            matchRegexp: 'Incorrect amount. Please enter X.YYY. eg. 1.000 or 0.005',
                                        }} 
                                        required />

                                </div>
                                {
                                    this.state.power_error ? (
                                        <div className="alert alert-danger mt-4" role="alert">
                                            <strong>Error!</strong> { this.state.power_error_text }
                                        </div>
                                    ) : null
                                }

                                {
                                    this.state.power_success ? (
                                        <div className="alert alert-success mt-4" role="alert">
                                            <strong>Success!</strong> Power has been upped!
                                        </div>
                                    ) : null
                                }
                               

                                <button 
                                    type="submit"
                                    className="btn btn-danger mt-2" 
                                    disabled={this.state.powering}
                                >Power Up</button>

                            </Formsy>

                        </div>

                       
                        
                    </div>

                    <div className="upload-wrapper mb-4">
                        <button className="btn btn-danger px-3" onClick={ this.displayKeys }>Display your private & public keys</button>
                        <code>
                            { JSON.stringify(this.state.keys) }
                        </code>
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


export default connect(mapStateToProps, { post })(Wallet);
