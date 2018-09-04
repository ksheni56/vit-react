import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { getSubs } from './../actions/app';
import { AVATAR_UPLOAD_PREFIX } from '../config';
import '../sass/Channel.scss';

class Subscriptions extends Component {

    constructor(props) {

        super(props);

        this.state = {
            loading: true
        }  

    } 

    componentDidMount() {
        if( (!this.props.app.username && !this.props.app.publicWif) || this.state.loading === false ) {
            return null;
        }

        this.props.getSubs({
            username: this.props.app.username,
            amount: 30
        }).then( response => {

            this.setState({
                loading: false
            });

        }).catch(err => {

            console.log("getSubs error", err);

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
                    <h3>Following</h3>
                    <div>
                        <i className="fa fa-ellipsis-v text-dark cursor-pointer"></i>
                    </div>
                </div>,
                <ul className="list-unstyled featured-channels-list" ref="subscriptions" key="subscriptions-list">
                    { 

                    this.props.subs.map(
                        (Subscription) =>
                            <li key={ Subscription.following } ref={ Subscription.following }>
                                <NavLink to={ '/@' + Subscription.following }>
                                    <div className="d-flex featured-channel-item">
                                        <div className="avatar-holder">
                                            <img src={ AVATAR_UPLOAD_PREFIX + Subscription.following + '/avatar/30x30'} alt="Avatar" />
                                        </div>
                                        <div className="data-holder">
                                            { Subscription.following }
                                        </div>
                                    </div>
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
        app: state.app,
        subs: state.app.subs
    };
    
}

export default connect(mapStateToProps, { getSubs })(Subscriptions);
