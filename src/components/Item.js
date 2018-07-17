import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment'

class Item extends Component {
    renderThumbnail() {
        let json_metadata = JSON.parse(this.props.data.json_metadata);
        //console.log("Thumb", json_metadata.vit_data)

        if(json_metadata && json_metadata.vit_data && json_metadata.vit_data.Hash) {
            let URL = "https://media.vit.tube/playback/" + json_metadata.vit_data.Hash + "/thumbnail-01.jpg";
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

    render() {
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
                        ${ this.displayPayoutAmount(this.props.data.pending_payout_value) }
                    </div>
                </div>
                <div className="meta-info">
                    <Link to={ "/@" + this.props.data.author }>{ this.props.data.author }</Link> &middot; { moment.utc(this.props.data.active).tz( moment.tz.guess() ).fromNow() }
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

export default connect(mapStateToProps, {})(Item);
