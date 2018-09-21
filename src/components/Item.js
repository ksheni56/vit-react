import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment'
import { VIDEO_THUMBNAIL_URL_PREFIX, LIQUID_TOKEN, VIDEO_THUMBNAIL_LIST_SIZE, SCREENSHOT_IMAGE, AVATAR_UPLOAD_PREFIX} from '../config'
import proxifyImage from '../utils/ProxifyImage';

class Item extends Component {
    renderThumbnail() {
        let json_metadata
        try {
            json_metadata = JSON.parse(this.props.data.json_metadata);
        } catch (e) { }

        if(json_metadata && json_metadata.vit_data && json_metadata.vit_data.Hash) {
            let URL;
            if (json_metadata.vit_data.Screenshot === undefined) {
                // for videos already on production, we use the default one
                URL = VIDEO_THUMBNAIL_URL_PREFIX + json_metadata.vit_data.Hash + "/thumbnail-01.jpg";
            } else {
                URL = AVATAR_UPLOAD_PREFIX + json_metadata.vit_data.Screenshot + '/' + SCREENSHOT_IMAGE;
            }
            URL = proxifyImage(URL, VIDEO_THUMBNAIL_LIST_SIZE)
            
            console.log("URL", URL);
            return <img
              onError={ e => {e.target.src="/images/thumbnail.jpg" }}
              src={ URL } className="img-fluid"
              alt="video thumbnail"
            />
        }
        return <img src="/images/thumbnail.jpg" className="img-fluid" alt="video thumbnail"/>
    }

    truncateTitle(title) {
        return title.substring(0, 40);
    }

    displayPayoutAmount(amount) {
        return parseInt(amount.replace(' SBD',''), 10).toFixed(2);
    }

    renderVertially() {
        return (
            <div className="col-lg-3 col-md-4 item-wrapper mb-3" key={ this.props.data.id } ref={ this.props.data.id }>
                <Link to={ "/@" + this.props.data.author + "/" + this.props.data.permlink }>
                    { this.renderThumbnail() }
                </Link>
                <div className="d-flex w-100">
                    <div className="title">
                        <Link to={ "/@" + this.props.data.author + "/" + this.props.data.permlink }>{this.truncateTitle(this.props.data.title)}</Link>
                    </div>
                    <div className="earnings text-right">
                        { this.displayPayoutAmount(this.props.data.pending_payout_value) } { LIQUID_TOKEN }
                    </div>
                </div>
                <div className="meta-info">
                    <Link to={ "/@" + this.props.data.author }>{ this.props.data.author }</Link> &middot; { moment.utc(this.props.data.created).tz( moment.tz.guess() ).fromNow() }
                </div>
            </div>
        )
    }

    renderHorizontally() {
        return (
            <div className="row item-wrapper mb-3" key={ this.props.data.id } ref={ this.props.data.id }>
                <div className="col-5">
                    <Link to={ "/@" + this.props.data.author + "/" + this.props.data.permlink }>
                        { this.renderThumbnail() }
                    </Link>
                </div>
                <div className="col-7">
                    <div className="d-flex w-100">
                        <h6>
                            <Link to={ "/@" + this.props.data.author + "/" + this.props.data.permlink }>{this.truncateTitle(this.props.data.title)}</Link>
                        </h6>
                        <div className="earnings text-right">
                            { this.displayPayoutAmount(this.props.data.pending_payout_value) } { LIQUID_TOKEN }
                        </div>
                    </div>
                    <div className="meta-info">
                        <span>{ this.props.data.category }</span> &middot; { moment.utc(this.props.data.created).tz( moment.tz.guess() ).fromNow() }
                    </div>
                </div>
            </div>
        )
    }

    render() {
        if (this.props.vertical) 
            return this.renderHorizontally()

        return this.renderVertially()
    }
}

function mapStateToProps(state) {
    return { 
        app: state.app
    };
}

export default connect(mapStateToProps, {})(Item);
