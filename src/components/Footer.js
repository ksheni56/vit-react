import React, { Component } from 'react';
import { connect } from 'react-redux';

class Footer extends Component {
    render() {
        return(
            <footer className="page-footer fixed-bottom font-small blue">
                <div className="container-fluid text-center text-md-left">
                    <div className="row">
                        <div className="col-md-12 mt-md-0 mt-3 text-right">
                            <a href="/privacy">Privacy Policy</a> | <a href="/2257">2257 Statement</a>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }
}

function mapStateToProps(state) {

    return {
    };

}

export default connect(mapStateToProps, {})(Footer);
