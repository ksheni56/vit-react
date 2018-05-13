import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { loginUser } from './actions/app';
import { Link } from 'react-router-dom';
import Formsy from 'formsy-react';
import moment from 'moment';
import TextField from './components/forms/TextField';

class Login extends Component {

    constructor(props) {

        super(props);

        this.state = {
            username: '',
            password: '',
            submitting: false
        }

        this.login = this.login.bind(this);

    } 

    componentWillReceiveProps(nextState) {
        if(nextState.app.username && nextState.app.publicWif) {
            this.props.history.push("/");
        }
    }

    login(form) {

        this.props.loginUser({

            username: form.username,
            password: form.password

        }).then( response => {

            console.log("loginUser success", response);
            localStorage.setItem("username", response.payload.username);
            localStorage.setItem("publicWif", response.payload.publicWif);
            localStorage.setItem("postingWif", response.payload.postingWif);
            

        }).catch(err => {

            console.log("loginUser error", err)

        });

    }


    componentDidMount() {

    }

    render() {
        
        return (
            <div className="row w-100 h-100 justify-content-center align-items-center">
                <div className="col-lg-3 col-md-5 col-10 align-self-center login-form">
                    <Formsy 
                        onValidSubmit={this.login} 
                        ref="login_form" 
                        >

                        <TextField 
                            name="username"
                            id="username"
                            label="Username"
                            value={this.state.username}
                            placeholder="" 
                            required />

                        <TextField 
                            name="password"
                            id="password"
                            label="Password or WIF"
                            type="password"
                            value={this.state.password} 
                            required />

                        <button type="submit" className="btn btn-primary" disabled={this.state.submitting}>Login</button>

                    </Formsy>
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

export default connect(mapStateToProps, { loginUser })(Login);
