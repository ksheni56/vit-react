import React, { Component } from 'react';
import { connect } from 'react-redux';

import Formsy from 'formsy-react';
import TextField from './components/forms/TextField';
import { ToastContainer, toast } from 'react-toastify';
import { RegionDropdown, CountryDropdown } from 'react-country-region-selector';
import { DMCA_TAKEDOWN_REQUEST_ENDPOINT } from './config';
import ComboSelect from 'react-formsy-combo-select';
import _ from 'lodash';

class DmcaInformation extends Component {
    constructor(props) {
        super(props);

        this.state = {
            infringements: [{
                url: '',
                description: ''
            }],
            first_name: '',
            last_name: '',
            copyright_holder: '',
            address: '',
            city: '',
            country: '',
            region: '',
            postal_code: '',
            phone_number: '',
            email: '',

            electronic_signature: '',
            submitting: false
        };

        this.infringementTypes = [
            { text: "Video", value: 1 },
            { text: "Photo", value: 2 },
            { text: "Original music or song", value: 3 },
            { text: "Software", value: 4 },
            { text: "Artwork", value: 5 },
        ];

        this.submitTakedownRequest = this.submitTakedownRequest.bind(this);
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

    changeInfringementDescription(infringement_idx, newDescription) {
        console.log(`Changing infringement id = ${infringement_idx} to desc=${newDescription}`);
        let infringements = this.state.infringements.slice();
        infringements[infringement_idx].description = newDescription;
        this.setState({
            infringements: infringements
        });
    }

    addExtraUrl() {
        // User needs to append more URLs to this complaint
        let infringements = this.state.infringements.slice();
        infringements.push({
            url: '',
            description: ''
        });

        this.setState({
            infringements: infringements
        });
    }

    submitTakedownRequest(form_data) {
        this.setState( { submitting: true } );

        console.log(`Takedown endpoint is ${DMCA_TAKEDOWN_REQUEST_ENDPOINT}`)

        toast.warning('Submitting complaint...');

        var complaint = {
            first_name: form_data.first_name,
            last_name: form_data.last_name,
            copyright_holder: form_data.copyright_holder,
            address: form_data.address,
            city: form_data.city,
            country: this.state.country,
            region: this.state.region,
            postal_code: form_data.postal_code,
            phone_number: form_data.phone_number,
            email: form_data.email,
            // this is a lot of fields to keep up to date...
            // there must be a cleaner way to do this with assign
            // that also lets me delete the infringement-*-description/url fields.
            infringements: [],
        };

        // Append the infringements to the blob
        for(var i = 0; i < this.state.infringements.length; ++i) {
            // FIXME: for some reason only 'description' gets set, the TextField
            // refuses to update the nested 'url' from the mapping.
            const url = form_data[`infringement-${i}-url`];
            const descriptionIndex = parseInt(this.state.infringements[i].description);
            const description = _.find(this.infringementTypes, x => x.value === descriptionIndex).text;

            complaint.infringements.push({
                url, description
            });
        }

        console.log("preparing to submit complaint");

        fetch(DMCA_TAKEDOWN_REQUEST_ENDPOINT, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(complaint)
        })
        .then(res => {
            if(res.ok) {
                toast.success("Successfully submitted complaint.");
            } else {
                toast.error("An error occurred when submitting the complaint.");
            }
        })
        .catch(err => {
            console.log(`Submit error: ${err}`);
            toast.error("An error occurred when submitting the complaint.");
        });

        this.setState( { submitting: false } );
    }

    render() {
        return (
            <div className="row justify-content-center">
                <ToastContainer/>

                <div className="col-md-8 col-sm-12 mt-4">
                    <div className="upload-wrapper mb-4">
                        <h2>DMCA Notice of Copyright Infringement</h2>
                        Click <a href="#takedown-form">here</a> to notify us of copyright infringement.
                        <p>Legal text goes here</p>
                    </div>

                    <div className="upload-wrapper mb-4">
                        <a name="takedown-form">
                            <h2>DMCA Takedown Form</h2>
                        </a>

                        <Formsy
                            onValidSubmit={this.submitTakedownRequest}
                            ref="upload_form">

                            <h4>Infringing Content</h4>
                            {
                                this.state.infringements.map((infringement, idx) => {
                                    return (
                                        <div className="col-md-8 col-sm-12 px-0" key={idx}>
                                            <h4>Content #{ idx + 1 }</h4>
                                            <TextField
                                                name={ `infringement-${idx}-url` }
                                                value={ infringement.url }
                                                label="Location (URL) of the allegedly infringing material:"
                                                required/>

                                            <div className="form-group">
                                                <label htmlFor={`infringement-${idx}-description`} className="form-label">
                                                    Description of the work claimed to be infringed:
                                                </label>
                                                <ComboSelect type="select"
                                                    name={ `infringement-${idx}-description`}
                                                    className="form-control"
                                                    value={ infringement.description }
                                                    onChange={ (value, text) => this.changeInfringementDescription(idx, value) }
                                                    data={ this.infringementTypes }
                                                    icon="fa fa-chevron-down"
                                                    iconSelectInactive=""
                                                    iconSelectActive="fa fa-check"
                                                />
                                            </div>
                                        </div>
                                    )
                                })
                            }
                            <button type="button"
                                className="btn mt-2"
                                onClick={ this.addExtraUrl.bind(this) }>
                                Add another URL
                            </button>

                            <h4>Your Details</h4>
                            <div className="col-md-8 col-sm-12 px-0">
                                <TextField
                                    name="first_name"
                                    id="first_name"
                                    label="First Name:"
                                    value={this.state.first_name}
                                    placeholder="Enter your first name"
                                    maxLength={100}
                                    required />

                                <TextField
                                        name="last_name"
                                        id="last_name"
                                        label="Last Name:"
                                        value={this.state.last_name}
                                        placeholder="Enter your last name"
                                        maxLength={100}
                                        required />

                                <TextField
                                        name="copyright_holder"
                                        id="copyright_holder"
                                        label="Copyright Holder:"
                                        value={this.state.copyright_holder}
                                        placeholder="Enter the name(s) of the copyright holder, if different"
                                        maxLength={100} />

                                <TextField
                                        name="address"
                                        id="address"
                                        label="Address:"
                                        value={this.state.address}
                                        placeholder="Enter your street address"
                                        maxLength={200}
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
                                    name="postal_code"
                                    id="postal_code"
                                    label="Postal or Zip Code:"
                                    value={this.state.postal_code}
                                    placeholder="Enter your postal code"
                                    maxLength={25}
                                    required />

                                <TextField
                                    name="phone_number"
                                    id="phone_number"
                                    label="Phone Number:"
                                    value={this.state.phone_number}
                                    placeholder="Enter your phone number"
                                    maxLength={30}
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
                                    value={this.state.electronic_signature}
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
