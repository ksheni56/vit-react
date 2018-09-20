import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loginUser } from './actions/app';
import Formsy from 'formsy-react';
import TextField from './components/forms/TextField';

class Login extends Component {

    constructor(props) {

        super(props);

        this.state = {
            username: '',
            password: '',
            submitting: false,
            error: false
        }

        this.login = this.login.bind(this);

    } 

    componentWillReceiveProps(nextState) {
        if(nextState.app.username && nextState.app.publicWif) {
            this.props.history.push("/");
        }
    }

    login(form) {

        if(this.state.error) {
            this.setState({
                error: false 
            });
        }

        this.props.loginUser({

            username: form.username,
            password: form.password

        }).then( response => {

            console.log("loginUser success", response);
            localStorage.setItem("username", response.payload.username);
            localStorage.setItem("publicWif", response.payload.publicWif);
            localStorage.setItem("postingWif", response.payload.postingWif);
            localStorage.setItem("signature", response.payload.signature);
            localStorage.setItem("signUserHost", response.payload.signUserHost);
            
        }).catch(err => {

            console.log("loginUser error", err);
            this.setState({
               error: true 
            });

        });

    }


    componentDidMount() {
        document.body.classList.add('login')

        if(this.props.match.params.username) {
            this.setState({
                username: this.props.match.params.username
            })
        }
    }

    componentWillUnmount() {
        document.body.classList.remove('login')
    }

    render() {
        
        return (
            <div className="row w-100 h-100 justify-content-center align-items-center">
                <div className="col-lg-3 col-md-5 col-10 align-self-center login-form">

                    <div className="col-12 text-center mb-4">
                        <img src="/images/logo.png" className="logo" alt="Logo" />
                    </div>

                    {
                        this.state.error ? (

                            <div className="alert alert-danger" role="alert">
                                <strong>Error!</strong> Invalid username or/and password.
                            </div>
                            

                        ) : null
                    
                    }

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

                        <button type="submit" className="btn btn-danger" disabled={this.state.submitting}>Login</button>

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
