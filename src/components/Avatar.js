import React from 'react';
import proxifyImage from './../utils/ProxifyImage'
import { 
    AVATAR_DEFAULT, 
    AVATAR_SIZE_SMALL, 
    AVATAR_SIZE_MEDIUM
} from '../config';

export default class Avatar extends React.Component {
    render() {
        const profile_image = this.props.profile_image ? this.props.profile_image : AVATAR_DEFAULT;
        let size = AVATAR_SIZE_SMALL;
        if (this.props.size === "medium") size = AVATAR_SIZE_MEDIUM;

        const profile_size = size + 'x' + size;
        return (
            <div className="avatar" style={{ 'background': `url( ` + proxifyImage(profile_image, profile_size) + ' ) no-repeat center center', 'backgroundSize': 'cover' }}></div>
        )
    }
}
