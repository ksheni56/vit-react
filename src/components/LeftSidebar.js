import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from '@steemit/steem-js';
import { Link } from 'react-router-dom';
import ReactDOM from 'react-dom';
import FeaturedChannels from './FeaturedChannels';
import Subscriptions from './Subscriptions';

class LeftSidebar extends Component {

    constructor(props) {

        super(props);

        this.state = {
            tags: [],
            loading: true,
            expanded: false
        }  

    } 

    componentDidMount() {
        
        steem.api.getTrendingTags('', 60, (err, result) => {

            if(err) {
                
                this.setState({
                    tags: [],
                    loading: false
                });

                return;
            }

                    
            this.setState({
                tags: result.filter(function(e) { return ['touch-tube','touchit-social'].indexOf(e.name) < 0 }),
                loading: false
            });

        });

    }

    toggleTags() {

        var node = ReactDOM.findDOMNode(this.refs.taglist);
        node.classList.toggle('tag-list');
        this.setState({
            expanded: !this.state.expanded
        })

    }

    getActiveClass(current_tag) {

        if(this.props.location.pathname.split("/")[1] === current_tag) {
            return "active";
        } else return null;
    }

    renderTags() {
        if(this.state.loading) {
            return (
                <div>Loading</div>
            )
        } else {

            if(this.state.tags.length === 0) {

                return (                    
                    <div className="no-results text-center mt-3 mb-5">No Categories:(</div>
                )


            } else {

                return [
                    <ul className="list-unstyled tag-list" ref="taglist" key="tag-list">
                        { 

                        this.state.tags.map(

                            (Tag) =>
                                <li key={ Tag.name } ref={ Tag.name }>
                                    {/* <Link className={ this.getActiveClass(Tag.name) } to={ '/' + Tag.name + '/new' } onClick={() => this.props.addSelectedTags(Tag.name)}>
                                        { Tag.name } <span className="active-dot"><i className="fa fa-circle text-danger"></i></span>
                                    </Link> */}
                                    <Link className={ this.getActiveClass(Tag.name) } to={ '/tags/new' } onClick={() => this.props.addSelectedTags(Tag.name)}>
                                        { Tag.name } <span className="active-dot"><i className="fa fa-circle text-danger"></i></span>
                                    </Link>
                                </li>
                            ) 

                        }
                    </ul>,

                    <button className="btn btn-dark btn-sm  btn-block" onClick={(e) => this.toggleTags(e)} key="tag-button-control">{ this.state.expanded ? 'Collapse' : 'Expand' }</button>
                ]
            }

        }
    }

    render() {
        console.log(this.props.app.seletedTags);
        return (
            <div className="col left-sidebar">
                <div className="d-flex justify-content-between align-items-center">
                    <h3>Categories</h3>
                    <div className="d-none">
                        <Link to="/categories">
                            <button type="button" className="btn btn-dark btn-sm">View All</button>
                        </Link>
                    </div>
                </div>
                
                { this.renderTags() }
                <FeaturedChannels/> 
                <Subscriptions/>
            </div>
        )
        
    }

}

function mapStateToProps(state) {

    return { 
        app: state.app
    };
    
}

const mapDispatchToProps = dispatch => {
    return {
        addSelectedTags: (tagName) => dispatch({
            type: 'UPDATE_SELECTED_TAGS',
            payload: tagName
        })
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(LeftSidebar);
