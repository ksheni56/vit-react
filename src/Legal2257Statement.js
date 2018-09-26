import React, { Component } from 'react';
import { connect } from 'react-redux';

class Legal2257Statement extends Component {
    render() {
        return (
            <div id="legal-background" className="upload-wrapper mb-4 mt-4">
                <h1>18 USC 2257 Statement: Touch.Tube</h1>
                <p>Touch.Tube is not a producer (primary or secondary) of any and all of the content found on the website (Touch.Tube). With respect to the records as per 18 USC 2257 for any and all content found on this site, please kindly direct your request to the site for which the content was produced.</p>
                <p>Touch.Tube is a video sharing site in which allows for the uploading, sharing and general viewing of various types of adult content and while Touch.Tube gives performs best efforts with verifying compliance, it may not be 100% accurate.</p>
                <p>Touch.Tube abides by the following procedures to ensure compliance:</p>
                <ul>
                    <li>Requiring all users to be 18 years of age to upload videos.</li>
                    <li>When uploading, user must verify the content; assure he/she is 18 years of age; certify that he/she keeps records of the models in the content and that they are over 18 years of age.</li>
                    <li>User confirms the uploaded video does not contain illegal material</li>
                    <li>User confirms he has the required rights to upload the video</li>
                </ul>
                <p>For further assistance and/or information in finding the content's originating site, please contact Touch.Tube compliance at copyright@touch.tube</p>
                <p>Touch.Tube allows content to be flagged as inappropriate. Should any content be flagged as illegal, unlawful, harassing, harmful, offensive or various other reasons, Touch.Tube shall remove it from the site without delay.</p>
                <p>Users of Touch.Tube who come across such content are urged to flag it as inappropriate by clicking the 'Flag this video' link found below each video.</p>
            </div>
        );
    }
}

function mapStateToProps(state) {

    return {
    };

}

export default connect(mapStateToProps, {})(Legal2257Statement);
