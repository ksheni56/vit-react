import React from 'react';
import { 
    AVATAR_DEFAULT
} from '../config';

export default class Avatar extends React.Component {
    render() {
        const profile_image = this.props.profile_image ? this.props.profile_image : AVATAR_DEFAULT;
        const profile_size = this.props.size || '';

        if (profile_size !== '') {
            return (
                <div className="avatar" style={{ 'background': `url( ` + profile_image + '/' + profile_size + ' ) no-repeat center center', 'backgroundSize': 'cover' }}></div>
            )
        } else {
            return (
                <div className="avatar" style={{ 'background': `url( ` + profile_image + ' ) no-repeat center center', 'backgroundSize': 'cover' }}></div>
            )
        }
    }
}
