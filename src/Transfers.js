import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { post } from './actions/post';
import './sass/Select.scss';
import { ToastContainer } from 'react-toastify';

class Transfers extends Component {

    constructor(props) {

        super(props);

        this.state = {
            loading: true,
            transfers: []
        };


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

    }

    displayHistory() {

        if(this.state.transfers.length === 0) {
            return (
                <div className="text-left" role="alert">
                    <strong>You don't have any transactions to display yet...</strong>
                </div>
            )
        } 

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
