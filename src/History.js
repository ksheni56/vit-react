import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import { post } from './actions/post';
import './sass/Select.scss';
import './sass/History.scss';
import { ToastContainer } from 'react-toastify';

class History extends Component {

    constructor(props) {

        super(props);

        this.state = {
            loading: true,
            uploads: [],
            panel: false,
            status: [],
        };
    } 

    componentWillMount() {
        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }
    }

    componentDidMount() {
        this.getUploadHistory()
        setInterval(function(){
            this.getUploadHistory();
        }.bind(this), 2000)
    }

    getUploadHistory() {
        axios.get("https://media.vit.tube/history/" + this.props.app.username).then(response => {
            this.setState({
                loading: false,
                uploads: response.data.uploads
            })
        })
    }

    displayHistory() {

        if(this.state.uploads.length === 0) {
            return (
                <div className="text-left" role="alert">
                    <strong>You don't have any uploads to display yet...</strong>
                </div>
            )
        } 

        return (
            <div className="table-responsive">
                <table className="table table-dark">

                    <tbody>

                        { 

                            Object.keys(this.state.uploads).map(

                                (Item) =>
                                    <tr key={Item} className="upload-item">
                                        <td>
                                            {Item}
                                        </td>
                                        <td>
                                            {
                                                this.state.uploads[Item].percent_complete ? 
                                                    this.state.uploads[Item].percent_complete + "% Complete" : "Pending"
                                            }
                                        </td>
                                    </tr>
                            )

                        }

                    </tbody>
                </table>
            </div>
        )
    }

    render() {

        const customStyles = {
            overlay: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.25)'
            },
            content : {
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#272C2F',
                borderRadius: '4px',
                padding: '20px',
                border: '1px solid #000',
                color: '#fff',
                h3 : {
                    color: '#fff',
                }
            },
        };

        return (
            <div className="row justify-content-center">

                <ToastContainer />

                <div className="col-8 mt-4">

                    <div className="upload-wrapper mb-4">
                        <div>

                            <h3 className="mb-1">Upload History</h3>
                            <p className="mb-4 text-muted">View your video upload history</p>

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


export default connect(mapStateToProps, { post })(History);
