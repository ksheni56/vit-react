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
import { ToastContainer, toast } from 'react-toastify';

class Transfers extends Component {

    constructor(props) {

        super(props);

        this.state = {
            loading: true,
            transfers: []
        };

        //this.transfer = this.transfer.bind(this);
        //this.displayKeys = this.displayKeys.bind(this);
        //this.powerUp = this.powerUp.bind(this);


    } 

    componentWillMount() {

        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        steem.api.getAccountHistory(this.props.app.username, -1, 100, (err, result) => {
            let transfers = result.filter( tx => tx[1].op[0] === 'transfer' )

            this.setState({
                 loading: false,
                transfers: transfers
            })
            console.log(transfers)
        });

        /*
        steem.api.getAccounts([this.props.app.username], (err, accounts) => {

            if(err || (accounts && accounts.length == 0)) {
                
                console.log("Invalid account!");

                return false; // Handle invalid account

            }

            let account_info = accounts[0];
            account_info.json_metadata = JSON.parse(accounts[0].json_metadata);
            account_info.vesting_shares = parseInt(account_info.vesting_shares)/1000000

            console.log("Account has been loaded", account_info);
            this.setState({
                loading: false,
                account: account_info
            })

        });
        */
    }

    displayHistory() {

        return (
            <div className="table-responsive">
                <table className="table table-dark small">

                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">From</th>
                            <th scope="col">To</th>
                            <th scope="col">Amount</th>
                            <th scope="col">Memo</th>
                        </tr>
                    </thead>
                    <tbody>

                        { 

                            this.state.transfers.map(

                                (Item) =>
                                    <tr key={ Item[1]['trx_id'] }>

                                        <td>{ moment(Item[1]['timestamp']).format('MM/DD/YY, h:mm:ss a') }</td>
                                        <td>@{ Item[1]['op'][1]['from'] }</td>
                                        <td>@{ Item[1]['op'][1]['to'] }</td>
                                        <td>{ Item[1]['op'][1]['amount'] }</td>
                                        <td><i>{ Item[1]['op'][1]['memo'] }</i></td>
                                       
                                    </tr>
                                ) 

                        }

                    </tbody>
                </table>
            </div>
        )
    }


    render() {
        
        return (
            <div className="row justify-content-center">

                <ToastContainer />

                <div className="col-8 mt-4">

                    <div className="upload-wrapper mb-4">
                        <Link to="/wallet" className="btn btn-danger px-3">Go Back</Link>
                    </div>

                    <div className="upload-wrapper mb-4">
                        <div>

                            <h3 className="mb-1">Funds Transfer</h3>
                            <p className="mb-4 text-muted">View the list of previous transfers on the VIT Network</p>

                            {
                                this.state.loading ? (
                                    <div className="text-center" role="alert">
                                        <strong>Loading...</strong>
                                    </div>
                                ) : (
                                    <div>{this.displayHistory()}</div>
                                )
                            }

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


export default connect(mapStateToProps, { post })(Transfers);
