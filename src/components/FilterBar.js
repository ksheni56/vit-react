import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';

class FilterBar extends Component {

    constructor(props) {

        super(props);

        this.state = {

        }

    }

    render() {

        return [
            <ul className="col filter-bar mb-4" key="filter-bar">
                <li><NavLink to={ this.props.path + "trending"} className="" activeClassName="active">Trending</NavLink></li>
                <li><NavLink to={ this.props.path + "new"} className="" activeClassName="active">New</NavLink></li>
                <li><NavLink to={ this.props.path + "hot"} className="" activeClassName="active">Hot</NavLink></li>
            </ul>
        ]

    }

}

function mapStateToProps(state) {

    return {
        search: state.search
    };

}

export default connect(mapStateToProps, {})(FilterBar);
