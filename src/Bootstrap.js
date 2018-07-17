import React, { Component } from 'react';
import LeftSidebar from './components/LeftSidebar';
import Header from './components/Header';
import { connect } from 'react-redux';
import steem from 'steem';
import { restoreLogin } from './actions/app';
import ReactDOM from 'react-dom';

class Bootstrap extends Component {

    constructor(props) {

        super(props);
        this.state = {
            initializing: true
        };  

        this.toggleLeftSidebarCallback = this.toggleLeftSidebarCallback.bind(this);

    } 

    componentDidMount() {

        // check if we have any creds saved up in localStorage
        let username = localStorage.getItem("username"), 
            publicWif = localStorage.getItem("publicWif"),
            postingWif = localStorage.getItem("postingWif");

        if(!username || !publicWif || !postingWif) {

            // not logged in, nothing in Local Storage. Just show the UI

            this.setState({
                initializing: false
            });

            return;
        }

        if(username && publicWif && !this.props.app.authorized) {

            // verify the creds against the blockchain
            steem.api.getAccounts([username], (err, accounts) => {

                console.log("accounts", accounts)


                if(accounts.length === 0) {
                    
                    // Invalid account name. Clean up local storage
                    localStorage.removeItem('username');
                    localStorage.removeItem('publicWif');
                    localStorage.removeItem('postingWif');

                    this.setState({
                        initializing: false
                    });

                    return;

                }

                // Verify publicWif against posting_key
                let posting_key = accounts[0]['posting'].key_auths[0][0];

                if(posting_key === publicWif) {

                    // saved creds are valid. Restore the session
                    this.props.restoreLogin({
                        "username": username,
                        "publicWif": publicWif,
                        "postingWif": postingWif
                    });

                } else {

                    // saved creds are not valid. Clean up local storage
                    localStorage.removeItem('username');
                    localStorage.removeItem('publicWif');
                    localStorage.removeItem('postingWif');

                }

                this.setState({
                    initializing: false
                });

            });

        }

    }

    toggleLeftSidebarCallback() {

        var node = ReactDOM.findDOMNode(this.refs.content_wrapper);
        node.classList.toggle('left-sidebar-off');

    }

    render() {

        return [
            <Header {...this.props} key="header" toggle={ this.toggleLeftSidebarCallback }/>,
            <div className="row mx-0 content-wrapper h-100" key="content-wrapper" ref="content_wrapper">

                {
                    this.state.initializing ? (
                        <div className="row w-100 h-100 justify-content-center align-items-center loader-wrapper">

                            <div className="loader">Loading...</div>

                        </div>
                    ) : (

                        <div className="row mx-0 h-100 w-100">
                            <LeftSidebar { ...this.props } />
                            <div className="col content">
                                { this.props.children }
                            </div> 
                        </div>
                        
                    )
                }

                           
            </div>
        ]

    }

}


function mapStateToProps(state) {

    return { 
        app: state.app
    };
    
}

export default connect(mapStateToProps, { restoreLogin })(Bootstrap);
