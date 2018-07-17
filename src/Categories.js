import React, { Component } from 'react';
import { connect } from 'react-redux';

class Categories extends Component {

    constructor(props) {

        super(props);

        this.state = {
            'uploading': false
        }

    } 

    componentDidMount() {

        

    }

    componentWillReceiveProps(nextProps) {    

    }

    

    render() {
        
        return (
            <div>Categories view. Work in progress.</div>
        )
        
    }

}

function mapStateToProps(state) {

    return { 
        search: state.search
    };
    
}


export default connect(mapStateToProps, {})(Categories);
