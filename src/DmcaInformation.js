import React, { Component } from 'react';
import { connect } from 'react-redux';

import Formsy from 'formsy-react';
import TextField from './components/forms/TextField';
import { ToastContainer, toast } from 'react-toastify';
import { RegionDropdown, CountryDropdown } from 'react-country-region-selector';

class DmcaInformation extends Component {
    constructor(props) {
        super(props);

        this.state = {
            firstname: '',
            lastname: '',
            address: '',
            country: '',
            region: '',
        };
    }

    changeCountry(newCountry) {
        this.setState({
            country: newCountry
        });
    }

    changeRegion(newRegion) {
        this.setState({
            region: newRegion
        });
    }

    render() {
        return (
            <div className="row justify-content-center">
                <ToastContainer/>

                <div className="col-md-8 col-sm-12 mt-4">
                    <div className="upload-wrapper mb-4">
                        <h3>DMCA Notice of Copyright Infringement</h3>
                        Click <a href="#takedown-form">here</a> to notify us of copyright infringement.
                        <p>Legal text goes here</p>
                    </div>

                    <div className="upload-wrapper mb-4">
                        <a name="takedown-form">
                            <h3>DMCA Takedown Form</h3>
                        </a>

                        <Formsy
                            onValidSubmit={this.submitTakedownRequest}
                            ref="upload_form">

                            // TODO: url list

                            <div className="col-md-8 col-sm-12 px-0">
                                <TextField
                                    name="firstname"
                                    id="firstname"
                                    label="First Name:"
                                    value={this.state.firstname}
                                    placeholder="Enter your first name"
                                    maxLength={100}
                                    required />

                                <TextField
                                        name="lastname"
                                        id="lastname"
                                        label="Last Name:"
                                        value={this.state.lastname}
                                        placeholder="Enter your last name"
                                        maxLength={100}
                                        required />

                                <TextField
                                        name="copyrightholder"
                                        id="copyrightholder"
                                        label="Copyright Holder:"
                                        value={this.state.copyrightholder}
                                        placeholder="Enter the name(s) of the copyright holder, if different"
                                        maxLength={100} />

                                <TextField
                                        name="address"
                                        id="address"
                                        label="Address:"
                                        value={this.state.address}
                                        placeholder="Enter your street address"
                                        maxLength={100}
                                        required />

                                <TextField
                                        name="city"
                                        id="city"
                                        label="City:"
                                        value={this.state.city}
                                        placeholder="Enter your city"
                                        maxLength={100}
                                        required />

                                <div className="form-group">
                                    <label htmlFor="country-selector" className="form-label">
                                        Country and Region: *
                                    </label>

                                    <CountryDropdown
                                        name="country-selector"
                                        classes="form-control"
                                        value={this.state.country}
                                        onChange={ (val) => this.changeCountry(val) }
                                        />

                                    <br/>

                                    <RegionDropdown
                                        name="region-selector"
                                        classes="form-control"
                                        value={this.state.region}
                                        country={this.state.country}
                                        onChange={ (val) => this.changeRegion(val) }
                                        />
                                </div>

                                <TextField
                                    name="postalcode"
                                    id="postalcode"
                                    label="Postal or Zip Code:"
                                    value={this.state.postalcode}
                                    placeholder="Enter your postal code"
                                    maxLength={20}
                                    required />

                                <TextField
                                    name="phonenumber"
                                    id="phonenumber"
                                    label="Phone Number:"
                                    value={this.state.phonenumber}
                                    placeholder="Enter your phone number"
                                    maxLength={20}
                                    required />

                                <TextField
                                    name="email"
                                    id="email"
                                    label="Email address"
                                    value={this.state.email}
                                    placeholder="Enter your email address"
                                    maxLength={100}
                                    required />

                                <h2>Attestation</h2>
                                <p>Check the following boxes to state that:</p>

                                <div className="form-check">
                                    <input type="checkbox"
                                        id="attestation-one"
                                        className="form-check-input"
                                        required>
                                    </input>
                                    <label className="form-check-label" htmlFor="attestation-one">UNDER PENALTY OF PERJURY, you are the owner or an agent authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</label>
                                </div>

                                <div className="form-check">
                                    <input type="checkbox"
                                        id="attestation-two"
                                        className="form-check-input"
                                        required>
                                    </input>
                                    <label className="form-check-label" htmlFor="attestation-two">You have a good faith belief that the use of the content in the manner complained of, is not authorized by the copyright owner, its agent, or the law.</label>
                                </div>

                                <div className="form-check">
                                    <input type="checkbox"
                                        id="attestation-three"
                                        className="form-check-input"
                                        required>
                                    </input>
                                    <label className="form-check-label" htmlFor="attestation-three">You acknowledge that you may be subject to liability if you knowingly make a material misrepresentation that activity is infringing. Fair use should also be taken into consideration.</label>
                                </div>

                                <div className="form-check">
                                    <input type="checkbox"
                                        id="attestation-four"
                                        className="form-check-input"
                                        required>
                                    </input>
                                    <label className="form-check-label" htmlFor="attestation-four">The information in this notification is accurate.</label>
                                </div>

                                <div className="form-check">
                                    <input type="checkbox"
                                        id="attestation-five"
                                        className="form-check-input"
                                        required>
                                    </input>
                                    <label className="form-check-label" htmlFor="attestation-five">You acknowledge that abuse of this tool may result in termination of your account.</label>
                                </div>

                                <h3>Please note that:</h3>
                                <p>The copyright owner’s name will be published in place of the disabled content. This will become part of the public record of your request, along with your description of the work(s) allegedly infringed. All the information provided in this DMCA Takedown Form (including your personal information) are part of the full takedown notice and may be forwarded to the uploader of the allegedly infringing content. By submitting this form, you consent to having your information revealed in this way.</p>
                                <p>We reserve the right to challenge abuses of the DMCA process, and your use of this form does not waive that right.</p>

                                <TextField
                                    id="electronicsignature"
                                    name="electronicsignature"
                                    value={this.state.electronicsignature}
                                    label="Type your full name here to provide your electronic signature:"
                                    required/>

                                <button
                                    type="submit"
                                    className="btn btn-danger mt-2"
                                    disabled={this.state.submitting || this.state.transfer_amount <= 0 }
                                >Send Takedown Request</button>
                            </div>
                        </Formsy>
                    </div>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        app: state.app
    };
}

export default connect(mapStateToProps)(DmcaInformation);
