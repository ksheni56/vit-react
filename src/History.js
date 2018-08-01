import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import axios from 'axios';
import { post } from './actions/post';
import './sass/Select.scss';
import './sass/History.scss';
import { ToastContainer } from 'react-toastify';

Modal.setAppElement(document.getElementById('root'))

class History extends Component {

    constructor(props) {

        super(props);

        this.state = {
            loading: true,
            uploads: [],
            panel: false,
            status: [],
            modalIsOpen: false,
            currentUpload: false,
            uploadComplete: false,
            uploadPercent: false,
            uploadHash: false,
            uploadPlaylist: false,
        };

        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);

    } 

    componentWillMount() {
        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }
    }

    componentDidMount() {
        this.getHistory();
    }

    openModal() {
        this.setState({modalIsOpen: true});
    }

    closeModal() {
        this.setState({modalIsOpen: false});
    }

    getHistory() {
        axios.get("http://192.168.0.7:5000/history/" + this.props.app.username).then(response => {
            console.log(response.data.uploads.length)

            this.setState({
                loading: false,
                uploads: response.data.uploads
            })
        })
    }

    getStatus(upload) {
        axios.get("http://192.168.0.7:5000/upload/video/status/" + upload).then(response => {
            this.setState({
                currentUpload: upload,
                uploadComplete: response.data.Complete,
                uploadPercent: response.data.Complete ? 100 : response.data.PercentComplete,
                uploadHash: response.data.Complete ? response.data.Hash : false,
                uploadPlaylist: response.data.Complete ? response.data.Playlist : false,
                modalIsOpen: true
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

                            this.state.uploads.map(

                                (Item) =>
                                    <tr key={Item} className="upload-item">
                                        <td style={{fontSize: '18px', lineHeight: '2em'}}>
                                            {Item}
                                        </td>
                                        <td className="progress-link">
                                            <button style={{width: '100%'}} onClick={() => this.getStatus(Item)} className='btn btn-dark'>Details</button>
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

                <Modal
                  isOpen={this.state.modalIsOpen}
                  onRequestClose={this.closeModal}
                  style={customStyles}
                  contentLabel="Upload Details"
                >

                  <h3 ref={subtitle => this.subtitle = subtitle}>Details</h3>

                  <hr/>

                  <div><b>Completed:</b> {this.state.uploadComplete ? "Yes" : "No"}</div>
                  <div><b>Percent Complete:</b> {this.state.uploadPercent}%</div>
                  <div><b>Hash:</b> {this.state.uploadHash}</div>
                  <div><b>Playlist:</b> {this.state.uploadPlaylist}</div>

                  <hr/>

                  <div style={{textAlign: 'right'}}>
                      <button onClick={this.closeModal} className='btn btn-dark'>Close</button>
                  </div>
                </Modal>

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
