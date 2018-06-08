import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { NavLink, Link } from 'react-router-dom';
import ReactDOM from 'react-dom';
import FeaturedChannels from './FeaturedChannels';
import { logout } from './../actions/app';


class Header extends Component {

    constructor(props) {

        super(props);

        this.state = {
            "authenticated": false
        }   

        this.logout = this.logout.bind(this);
        this.toggleLeftSidebar = this.toggleLeftSidebar.bind(this);

    } 

    componentWillMount() {
        
        if(this.props.app.username && this.props.app.publicWif) {
            this.setState({
                authenticated: true
            })
        }

    }

    componentWillReceiveProps(nextProps) { 

        if(nextProps.app.username && nextProps.app.publicWif) {
            this.setState({
                authenticated: true
            })
        }

    }

    toggleLeftSidebar() {

        this.props.toggle();

    }

    logout() {
        this.setState({
            authenticated: false
        })

        this.props.logout();
    }

    render() {
        
        return (
            <div className="row mx-0 header align-items-center" key="header">
                <div className="col logo-wrapper">
                    <button type="button" className="btn btn-light mr-2 left-sidebar-toggle" onClick={(e) => this.toggleLeftSidebar(e)} >
                        <i className="fas fa-bars"></i>
                    </button>
                    <img src="/images/logo.png" className="logo"/>
                </div>
                <div className="col search-wrapper">
                    <div className="form-group my-0">
                        <i className="fa fa-search"></i>
                        <input type="email" className="form-control" placeholder="Search something..." />
                    </div>
                </div>
                <div className="col controls-wrapper">
                    <div className="d-flex justify-content-end">

                        {
                            this.state.authenticated ? (
                                <span>
                                    <button type="button" className="btn btn-light mx-3" onClick={this.logout}>Logout</button>
                                    <Link to="/upload" className="btn btn-danger"><i className="fa fa-cloud-upload-alt mr-2"></i>Upload</Link>
                                </span>

                            ) : (

                                <span>
                                    <Link to="/login" className="btn btn-light">Login</Link>
                                    <Link to="/signup" className="btn btn-light mx-3">Signup</Link>
                                    <Link to="/login" className="btn btn-danger"><i className="fa fa-cloud-upload-alt mr-2"></i>Upload</Link>
                                </span>

                            )

                        }

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

export default connect(mapStateToProps, { logout })(Header);
