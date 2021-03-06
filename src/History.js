import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from '@steemit/steem-js';
import { post } from './actions/post';
import './sass/Select.scss';
import './sass/History.scss';
import Item from './components/Item';
import debounce from 'lodash.debounce';
import { shouldDisplayPost } from './utils/Filter'

class History extends Component {

    constructor(props) {

        super(props);

        this.pageSize = 10;

        this.scrollThreshold = 10;

        this.state = {
            posts: [],
            loading: true,
            loading_more: false,
            'blockedUsers': [],
            'dmcaContents': [],
        };
    } 

    componentWillMount() {
        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }
    }

    componentDidMount() {
        this.loadContent()
        this.attachScrollListener()
    }

    componentWillUnmount() {
        this.detachScrollListener();
    }

    componentWillReceiveProps(nextProps) {

        if( nextProps.blockedUsers !== this.state.blockedUsers ) {
            this.setState({
                blockedUsers: nextProps.blockedUsers,
                loading: true
            })
        }

        if( nextProps.dmcaContents !== this.state.dmcaContents ) {
            this.setState({
                dmcaContents: nextProps.dmcaContents,
                loading: true
            })
        }

    }

    attachScrollListener() {
        window.addEventListener('scroll', this.scrollListener, {
            capture: false,
            passive: true,
        });
    }

    detachScrollListener() {
        window.removeEventListener('scroll', this.scrollListener)
    }    

    scrollListener = debounce(() => {
        if(window.innerHeight + window.scrollY + this.scrollThreshold >= document.documentElement.scrollHeight) {
            this.loadMoreContent();
        }
    }, 150)

    loadContent() {

        let query = {
            'tag': this.props.app.username,
            'limit': this.pageSize
        };

        steem.api.getDiscussionsByBlog(query, (err, result) => {

            console.log("getDiscussionsByBlog", err, result);

            if(err) {

                this.setState({
                    posts: [],
                    no_more_post: true,
                    loading: false
                });

                return;
            }

            var related_posts = []

            result.forEach((post) => {
                if (shouldDisplayPost(this.state, post, related_posts)) {
                    related_posts.push(post)
                }
            })

            this.setState({
                no_more_post: result.length < this.pageSize,
                posts: related_posts,
                loading: false
            });

        });
    }

    loadMoreContent() {

        if (this.state.loading || this.state.loading_more || this.state.no_more_post) return;

        this.setState({
            loading_more: true
        })

        let load_more_query = {
            'tag': this.props.app.username,
            'limit': this.pageSize + 1,
            'start_author': this.props.app.username,
            'start_permlink': this.state.posts[this.state.posts.length - 1].permlink
        };


        steem.api.getDiscussionsByBlog(load_more_query, (err, result) => {
            if(err) {
                this.setState({
                    no_more_post: true,
                    loading: false
                });
                return false; // add some sort of alert notifying about the end of the loop
            }

            result.splice(0, 1);

            var related_posts = []
            var all_posts = []

            result.forEach((post) => {
                if (shouldDisplayPost(this.state, post, this.state.posts)) {
                    related_posts.push(post)
                }
            })

            all_posts = this.state.posts.concat(related_posts);

            this.setState({
                loading_more: false,
                no_more_post: result.length < this.pageSize,
                posts: all_posts
            });
        });
    }

    renderPosts() {
        if(this.state.loading) {
            return (
                <div className="row w-100 h-100 justify-content-center mt-5">

                    <div className="loader">Loading...</div>

                </div>
            )
        } else {
            return (
                <div className="row justify-content-center">
                    <div className="col-md-8 col-sm-12 mt-4 upload-wrapper">
                        <h3 className="mb-4">Your History</h3>
                        { 
                            this.state.posts.length === 0 ?
                            (
                                <p>You haven't posted any video!</p>
                            ):(
                                this.state.posts.map(
                                    (Post) =>
                                        <Item key={ Post.id } ref={ Post.id } data={ Post } vertical="true" />
                                )
                            )
                        }
                    </div>
                </div>
            )
        }
    }

    render() {
        
        return [
            <div key="posts">{ this.renderPosts() }</div>,
            <div className="mb-4 mt-3 text-center loader-more" key="load-more">
                {
                    !this.state.loading && this.state.loading_more ? (
                        <i className="fas fa-circle-notch fa-spin fa-lg"></i>
                    ) : (
                        null
                    )
                }
            </div>
        ]
    }

}

function mapStateToProps(state) {

    return { 
        search: state.search,
        app: state.app,
        blockedUsers: state.app.blockedUsers,
        dmcaContents: state.app.dmcaContents,
    };
    
}


export default connect(mapStateToProps, { post })(History);
