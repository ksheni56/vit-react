import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { Link } from 'react-router-dom';
import { post } from './actions/post';
import { loginUser } from './actions/app';
import Formsy from 'formsy-react';
import TextField from './components/forms/TextField';
import TokenAmountSlider from './components/forms/TokenAmountSlider';
import './sass/Select.scss';
import 'rc-slider/assets/index.css';
import { ToastContainer, toast } from 'react-toastify';
import { vestingSteem, numberWithCommas } from './utils/Format';
import { LIQUID_TOKEN } from './config';

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
            transfer_amount: 0,
            memo: '',
            keys: '',
            keys_revealed: false,
            power_to: this.props.app.username,
            power_amount: 0,
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

        steem.api.getAccountHistory(this.props.app.username, -1, 100, (err, result) => {
            let transfers = result.filter( tx => tx[1].op[0] === 'transfer' )
            console.log(transfers)
        });

        this.updateAccountBalance();
    }

    updateAccountBalance () {
        steem.api.getDynamicGlobalProperties((err, gprops) => {
            steem.api.getAccounts([this.props.app.username], (err, accounts) => {

                if(err || (accounts && accounts.length === 0)) {
                    console.log("Invalid account!");
                    return false; // Handle invalid account
                }

                let account_info = accounts[0];
                try {
                    account_info.json_metadata = JSON.parse(accounts[0].json_metadata);
                } catch (error) {
                    // in case meta data is empty or malformed
                }
                account_info.raw_balance = parseFloat(account_info.balance.split(' ')[0]);
                account_info.balance = account_info.balance.split(' ')[0] + ' ' + LIQUID_TOKEN;
                account_info.vesting_shares = numberWithCommas(vestingSteem(account_info, gprops).toFixed(3)) + ' ' + LIQUID_TOKEN;
                console.log("Account has been loaded", account_info);
                this.setState({
                    loading: false,
                    account: account_info
                })
            });
        });
    }

    displayKeys() {
        var confirmation = prompt("Please enter your VIT password to confirm this action", "");
        if(confirmation) {
            loginUser({
                username: this.props.app.username,
                password: confirmation
            }).then(response => {
                console.log("login success, displaying keys");

                let keys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"]);
                this.setState({
                    keys: keys,
                    keys_revealed: true
                });
            }).catch(err => {
                console.log("login failed when attempting to display keys", err);
                toast.error("Password incorrect, please try again.");
            });
        } else {
            // maybe next time
        }
    }

    powerUp(form_data) {

        // use owner key

        this.setState({
            //power_error_text: 'Something went wrong',
            //power_error: false,
            powering: true,
            //power_success: false
        });

        let amount = this.state.power_amount.toFixed(3) + " " + LIQUID_TOKEN,
        confirmation = prompt("Please enter your VIT password to confirm this action", "");

        if(confirmation) {

            loginUser({
                username: this.props.app.username,
                password: confirmation
            }).then(response => {
                console.log("login success, powering up.");

                let keys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"])

                steem.broadcast.transferToVesting(keys.owner, this.props.app.username, form_data.power_to, amount, (err, result) => {

                    console.log(err, result)

                    if(err) {

                        let error_message = this.parseError(err);

                        toast.error(error_message);

                        this.setState({
                            powering: false,
                        });

                        return;
                    }

                    this.setState({
                        //power_success: true,
                        powering: false
                    });

                    toast.success("Power is now upped!");

                    // Update balance
                    this.updateAccountBalance();

                });
            }).catch(err => {
                console.log("login failed when attempting to power up", err);
                toast.error("Password incorrect, please try again.");

                this.setState({
                    powering: false
                });
            });
        }

    }

    transfer(form_data) {

        var confirmation = prompt("Please enter your VIT password to confirm this transaction", "");

        if(confirmation) {

            loginUser({
                username: this.props.app.username,
                password: confirmation
            }).then(response => {
                this.setState({
                    transferring: true
                });

                let amount = this.state.transfer_amount.toFixed(3) + " " + LIQUID_TOKEN,
                    keys = steem.auth.getPrivateKeys(this.props.app.username, confirmation, ["owner", "memo", "active", "posting"])

                steem.broadcast.transfer(keys.active, this.props.app.username, form_data.to, amount, form_data.memo, (err, result) => {
                    if(err) {
                        console.log(err)
                        this.setState({
                            transferring: false
                        });

                        let error_message = this.parseError(err);
                        console.log("error_message",error_message)

                        toast.error(error_message);

                        return;
                    }

                    console.log("Transfer results", result);

                    toast.success("Your transaction is now completed!");

                    this.setState({
                        transferring: false
                    });

                    // Update balance
                    this.updateAccountBalance();
                });
            }).catch(err => {
                console.log("login failed when attempting to transfer", err);
                toast.error("Password incorrect, please try again.");

                this.setState({
                    transferring: false
                });
            });
        } else {


        }

    }

    parseError(err) {
        console.log("parseError called", err)

        // Parse some common errors

        if(err.data.name === 'tx_missing_active_auth') {
            // Invalid key
            return "Error! The VIT password you've provided is incorrect.";
        } else if ( (err.data.name === 'assert_exception' && err.data.stack[0].context.method === 'validate_account_name') || (err.data.message === 'unknown key' && err.data.stack[0].context.method === 'get_account') ) {
            // Invalid recipient
            return "Error! The recipient's name you've provided is incorrect.";
        } else if ( err.data.name === 'assert_exception' && err.data.stack[0].format === '_db.get_balance( from_account, o.amount.symbol ) >= o.amount: Account does not have sufficient funds for transfer.') {
            // Not enough funds:(
            return "Error! You don't have sufficient funds to complete this transaction.";
        }

        return err.data.message;

    }

    onTransferValueChange = (value) => {
        this.setState({
            transfer_amount: value || 0,
        });
    }

    onPowerUpValueChange = (value) => {
        this.setState({
            power_amount: value || 0,
        });
    }

    render() {

        return (
            <div className="row justify-content-center">

                <ToastContainer />

                <div className="col-md-8 col-sm-12 mt-4">

                    <div className="upload-wrapper mb-4">
                        <div>

                            {
                                this.state.loading ? (
                                    <h3>Loading your balance...</h3>
                                ) : (
                                    <div className="balance-wrapper">

                                        <div className="row">

                                            <div className="col-md-4 col-sm-12">
                                                <div className="balance-tile">
                                                    <h4>VIT Balance:</h4>
                                                    <span className="text-danger">{ this.state.account.balance }</span>
                                                </div>
                                            </div>

                                            {/* <div className="col-3">
                                                <div className="balance-tile">
                                                    <h4>VBD Balance:</h4>
                                                    <span className="text-danger">{ this.state.account.sbd_balance }</span>
                                                </div>
                                            </div>

                                            <div className="col-md-4 col-sm-12">
                                                <div className="balance-tile">
                                                    <h4>VESTS Balance:</h4>
                                                    <span className="text-danger">{ this.state.account.delegated_vesting_shares }</span>
                                                </div>
                                            </div>
                                            */}

                                            <div className="col-md-4 col-sm-12">
                                                <div className="balance-tile">
                                                    <h4>VIT Power:</h4>
                                                    <span className="text-danger">{ this.state.account.vesting_shares }</span>
                                                </div>
                                            </div>

                                        </div>

                                        <div className="row">
                                            <div className="col-12 balance-action-links">
                                                <Link className="text-danger" to="/transfers">View Transfers History</Link>
                                            </div>
                                        </div>

                                    </div>
                                )
                            }

                        </div>
                    </div>

                    <div className="upload-wrapper mb-4">
                        <div>

                            <h3 className="mb-1">Transfer Your Funds</h3>
                            <p className="mb-4 text-muted">Move funds to another VIT account.</p>

                            <Formsy
                                onValidSubmit={this.transfer}
                                ref="upload_form"
                                >

                                <div className="col-md-8 col-sm-12 px-0">

                                    <TextField
                                        name="to"
                                        id="to"
                                        label="To:"
                                        value={this.state.to}
                                        placeholder="Enter VIT username"
                                        maxLength={100}
                                        required />

                                    <TokenAmountSlider
                                        name="transfer_amount"
                                        id="transfer_amount"
                                        label={ `Amount to Transfer (${LIQUID_TOKEN})` }
                                        isRequired="true"
                                        disabled={ this.state.account.raw_balance <= 0.0 }
                                        min={ 0 }
                                        value={ this.state.transfer_amount }
                                        max={ this.state.account.raw_balance }
                                        step={ 0.001 }
                                        onChange={ this.onTransferValueChange }
                                        userCanType/>

                                    <TextField
                                        name="memo"
                                        id="memo"
                                        label="Memo:"
                                        value={this.state.memo}
                                        placeholder="This memo is public"
                                        maxLength={100}
                                    />

                                    <small className="mb-2 d-none" style={{'marginTop': '-5px'}}><a href="#transfer-all" className="text-danger">Transfer all balance</a></small>


                                </div>



                                <button
                                    type="submit"
                                    className="btn btn-danger mt-2"
                                    disabled={this.state.transferring || this.state.transfer_amount <= 0 }
                                >Transfer</button>

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

                                <div className="col-md-8 col-sm-12 px-0">

                                    <TextField
                                        name="power_to"
                                        id="power_to"
                                        label="To:"
                                        value={this.state.power_to}
                                        placeholder="Enter VIT username"
                                        maxLength={100}
                                        required />

                                    <TokenAmountSlider
                                        name="power_amount"
                                        id="power_amount"
                                        label={ `Power Up Amount (${LIQUID_TOKEN})` }
                                        isRequired="true"
                                        disabled={ this.state.account.raw_balance <= 0.0 }
                                        min={ 0 }
                                        value={ this.state.power_amount }
                                        max={ this.state.account.raw_balance }
                                        step={ 0.1 }
                                        onChange={ this.onPowerUpValueChange }
                                        userCanType/>

                                </div>



                                <button
                                    type="submit"
                                    className="btn btn-danger mt-2"
                                    disabled={this.state.powering || this.state.power_amount <= 0 }
                                >Power Up</button>

                            </Formsy>

                        </div>



                    </div>

                    <div className="upload-wrapper mb-4">
                        <button className="btn btn-danger px-3" onClick={ this.displayKeys }>Display your private & public keys</button>

                        {
                            this.state.keys_revealed ? (
                                <div className="table-responsive">
                                    <table className="table table-dark small mt-3">

                                        <thead>
                                            <tr>
                                                <th scope="col" style={{width:'30%'}}>Type</th>
                                                <th scope="col" style={{width:'70%'}}>Key</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <th style={{width:'30%'}}>Owner</th>
                                                <td style={{width:'70%'}}>{this.state.keys['owner']}</td>
                                            </tr>

                                            <tr>
                                                <th style={{width:'30%'}}>ownerPubkey</th>
                                                <td style={{width:'70%'}}>{this.state.keys['ownerPubkey']}</td>
                                            </tr>

                                            <tr>
                                                <th style={{width:'30%'}}>memo</th>
                                                <td style={{width:'70%'}}>{this.state.keys['memo']}</td>
                                            </tr>

                                            <tr>
                                                <th style={{width:'30%'}}>memoPubkey</th>
                                                <td style={{width:'70%'}}>{this.state.keys['memoPubkey']}</td>
                                            </tr>

                                            <tr>
                                                <th style={{width:'30%'}}>active</th>
                                                <td style={{width:'70%'}}>{this.state.keys['active']}</td>
                                            </tr>

                                            <tr>
                                                <th style={{width:'30%'}}>activePubkey</th>
                                                <td style={{width:'70%'}}>{this.state.keys['activePubkey']}</td>
                                            </tr>

                                            <tr>
                                                <th style={{width:'30%'}}>posting</th>
                                                <td style={{width:'70%'}}>{this.state.keys['posting']}</td>
                                            </tr>

                                            <tr>
                                                <th style={{width:'30%'}}>postingPubkey</th>
                                                <td style={{width:'70%'}}>{this.state.keys['postingPubkey']}</td>
                                            </tr>


                                        </tbody>
                                    </table>
                                </div>
                            ) : null
                        }


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
