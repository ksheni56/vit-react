import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

class Footer extends Component {
    render() {
        return(
            <footer className="page-footer fixed-bottom text-center">
                <Link style={{'color': 'white'}} to="/privacy">Privacy Policy</Link>
                &nbsp;|&nbsp;
                <Link style={{'color': 'white'}} to="/2257">2257 Statement</Link>
                &nbsp;|&nbsp;
                <Link style={{'color': 'white'}} to="/dmca">DMCA</Link>
            </footer>
        );
    }
}

function mapStateToProps(state) {

    return {
    };

}

export default connect(mapStateToProps, {})(Footer);
