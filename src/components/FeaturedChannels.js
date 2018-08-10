import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import List from './../featured.json'
import proxifyImage from './../utils/ProxifyImage'

class FeaturedChannels extends Component {

    constructor(props) {

        super(props);

        List.forEach(element => {
            element.avatar = proxifyImage(element.avatar, "30x30")
        });

        this.state = {
            featured: List
        }  

    } 

    componentDidMount() {}

    render() {
        
        return (
            <div>
                <h3>Featured Users</h3>
                <ul className="list-unstyled featured-channels-list">
                    { 

                    this.state.featured.map(

                        (Channel) =>
                            <li key={ Channel.url } ref={ Channel.url }>
    
                                <NavLink to={ '/@' + Channel.url }>
                                    <div className="d-flex featured-channel-item">
                                        <div className="avatar-holder">
                                            <img src={Channel.avatar} alt="Avatar" />
                                        </div>
                                        <div className="data-holder">
                                            { Channel.name }
                                        </div>
                                    </div>
                                </NavLink>
                            </li>
                        ) 

                    }
                </ul>
                <button className="btn btn-dark btn-block btn-sm d-none">Discover</button>
            </div>
        )
        
    }

}

function mapStateToProps(state) {

    return { 
        search: state.search
    };
    
}

export default connect(mapStateToProps, {})(FeaturedChannels);
