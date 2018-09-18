import React, { Component } from 'react';
import Hls from 'hls.js';


class HLS extends Component {

    constructor(props, context) {
        super(props, context);
        /*
            There are lots of configuration options avialable here:
            https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning
        */
        let config = {
            startLevel: 10,
        }
        this.hls = new Hls(config);
    } 

    componentWillReceiveProps(nextProps) {}

    componentDidMount() {

        const { src, video } = this.props;
        if (Hls.isSupported()) {
            this.hls.loadSource(src);
            this.hls.attachMedia(video);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // Video loaded
                //video.play();
            });
        }
    }

     componentWillUnmount() {
        if (this.hls) {
            this.hls.destroy();
        }
    }


    render() {

        return (
            <source
                src={this.props.src}
                type={this.props.type || 'application/x-mpegURL'}
            />
        )
        
    }

}


export default HLS;
