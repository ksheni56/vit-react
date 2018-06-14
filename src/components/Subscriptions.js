import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { NavLink } from 'react-router-dom';
import ReactDOM from 'react-dom';
import List from './../featured.json'
import { getSubs } from './../actions/app';

class Subscriptions extends Component {

    constructor(props) {

        super(props);

        this.state = {
            subscriptions: [],
            loading: true
        }  

    } 

    componentDidMount() {

        this.props.getSubs({
            username: this.props.app.username,
            amount: 3
        }).then( response => {

            this.setState({
                subscriptions: response.payload,
                loading: false
            });

        }).catch(err => {

            console.log("castVote error", err);

        });

    }

    renderSubscription() {

        if( !this.props.app.username && !this.props.app.publicWif ) {
            return null;
        }

        if(this.state.loading) {
            return (
                <div>Loading</div>
            )
        } else {
            return [

                <div className="d-flex justify-content-between align-items-center" key="section-title">
                    <h3>Subscriptions</h3>
                    <div>
                        <i className="fa fa-ellipsis-v text-dark cursor-pointer"></i>
                    </div>
                </div>,
                <ul className="list-unstyled" ref="subscriptions" key="subscriptions-list">
                    { 

                    this.state.subscriptions.map(

                        (Subscription) =>
                            <li key={ Subscription.following } ref={ Subscription.following }>
    
                                <NavLink to={ '/@' + Subscription.following }>
                                    { Subscription.following }
                                </NavLink>
                            </li>
                        ) 

                    }
                </ul>
            ]
        }
    }

    render() {
        
        return this.renderSubscription();
        
    }

}

function mapStateToProps(state) {

    return { 
        app: state.app
    };
    
}

export default connect(mapStateToProps, { getSubs })(Subscriptions);
