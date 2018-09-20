import React, { Component } from 'react';
import { connect } from 'react-redux';
import FilterBar from './components/FilterBar';
import Item from './components/Item';
import steem from 'steem';
import debounce from 'lodash.debounce';
import { PAGESIZE_HOMEPAGE } from './config'

class Home extends Component {

    constructor(props) {

        super(props);

        this.pageSize = PAGESIZE_HOMEPAGE;

        this.scrollThreshold = 10;

        this.state = {
            'filter': '',
            'loading': true,
            'posts': [],
            'loading_more': false,
            no_more_post: false
        }

        this.loadMoreContent = this.loadMoreContent.bind(this);

    }

    componentDidMount() {

        if(!this.props.match.params.filter) this.props.history.push('trending');
        else {
            this.setState({
                filter: this.props.match.params.filter
            })
            this.loadContent(this.props.match.params.filter);
        }

        this.attachScrollListener();
    }

    componentWillReceiveProps(nextProps) {

        if( nextProps.match.params.filter !== this.state.filter ) {
            this.setState({
                filter: nextProps.match.params.filter,
                loading: true
            },
            () => {
                this.loadContent(this.state.filter);
            });

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

    loadMoreContent() {

        if (this.state.loading || this.state.loading_more || this.state.no_more_post) return;

        if(this.state.posts.length === 0) {
            return;
        }

        this.setState({
            loading_more: true
        })

        let load_more_query =  {
            'tag': '',
            'limit': this.pageSize + 1,
            'start_author': this.state.posts[this.state.posts.length - 1].author,
            'start_permlink': this.state.posts[this.state.posts.length - 1].permlink
        }

        // TODO: refactore the code below

        if(this.state.filter === 'trending') {

            steem.api.getDiscussionsByTrending(load_more_query, (err, result) => {

                if(err) {
                    console.log("Error:(", err)

                    this.setState({
                        posts: [],
                        no_more_post: true,
                        loading_more: false
                    });

                    return;
                }

                result.splice(0, 1);

                var related_posts = []
                var all_posts = []

                result.forEach((post) => {
                    try {
                        if (JSON.parse(post.json_metadata).tags &&
                                JSON.parse(post.json_metadata).tags.indexOf('touch-tube') >= 0) {
                            related_posts.push(post)
                        }
                    } catch(e) {
                        // do something?; likely not a related post anyway
                    }
                })

                all_posts = this.state.posts.concat(related_posts);

                this.setState({
                    posts: all_posts,
                    no_more_post: result.length < this.pageSize,
                    'loading_more': false
                })

            });

        } else if(this.state.filter === 'new') {

            steem.api.getDiscussionsByCreated(load_more_query, (err, result) => {

                if(err) {
                    console.log("Error:(", err)

                    this.setState({
                        posts: [],
                        no_more_post: true,
                        loading_more: false
                    });

                    return;
                }

                result.splice(0, 1);

                var related_posts = []
                var all_posts = []

                result.forEach((post) => {
                    try {
                        if (JSON.parse(post.json_metadata).tags &&
                                JSON.parse(post.json_metadata).tags.indexOf('touch-tube') >= 0) {
                            related_posts.push(post)
                        }
                    } catch(e) {
                        // do something?; likely not a related post anyway
                    }
                })

                all_posts = this.state.posts.concat(related_posts);

                this.setState({
                    posts: all_posts,
                    no_more_post: result.length < this.pageSize,
                    'loading_more': false
                })
            });

        } else if(this.state.filter === 'hot') {

            steem.api.getDiscussionsByHot(load_more_query, (err, result) => {

                if(err) {
                    console.log("Error:(", err)

                    this.setState({
                        posts: [],
                        no_more_post: true,
                        loading_more: false
                    });

                    return;
                }

                result.splice(0, 1);

                var related_posts = []
                var all_posts = []

                result.forEach((post) => {
                    try {
                        if (JSON.parse(post.json_metadata).tags &&
                                JSON.parse(post.json_metadata).tags.indexOf('touch-tube') >= 0) {
                            related_posts.push(post)
                        }
                    } catch(e) {
                        // do something?; likely not a related post anyway
                    }
                })

                all_posts = this.state.posts.concat(related_posts);

                this.setState({
                    posts: all_posts,
                    no_more_post: result.length < this.pageSize,
                    'loading_more': false
                })

            });

        } else {

        }

    }

    loadContent(filter) {


        let query = {
            'tag': '',
            'limit': this.pageSize,
        }

        if(filter === 'trending') {

            steem.api.getDiscussionsByTrending(query, (err, result) => {

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
                    try {
                        if (JSON.parse(post.json_metadata).tags &&
                                JSON.parse(post.json_metadata).tags.indexOf('touch-tube') >= 0) {
                            related_posts.push(post)
                        }
                    } catch(e) {
                        // do something?; likely not a related post anyway
                    }
                })

                this.setState({
                    posts: related_posts,
                    no_more_post: result.length < this.pageSize,
                    loading: false
                });

            });

        } else if(filter === 'new') {

            steem.api.getDiscussionsByCreated(query, (err, result) => {

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
                    try {
                        if (JSON.parse(post.json_metadata).tags &&
                                JSON.parse(post.json_metadata).tags.indexOf('touch-tube') >= 0) {
                            related_posts.push(post)
                        }
                    } catch(e) {
                        // do something?; likely not a related post anyway
                    }
                })

                this.setState({
                    posts: related_posts,
                    no_more_post: result.length < this.pageSize,
                    loading: false
                });

            });

        } else if(filter === 'hot') {

            steem.api.getDiscussionsByHot(query, (err, result) => {

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
                    try {
                        if (JSON.parse(post.json_metadata).tags &&
                                JSON.parse(post.json_metadata).tags.indexOf('touch-tube') >= 0) {
                            related_posts.push(post)
                        }
                    } catch(e) {
                        // do something?; likely not a related post anyway
                    }
                })

                this.setState({
                    posts: related_posts,
                    no_more_post: result.length < this.pageSize,
                    loading: false
                });

            });

        } else {
            this.setState({
                posts: [],
                no_more_post: true,
                loading: false
            });
        }

    }

    renderPosts() {
        if(this.state.loading) {
            return (
                <div className="row w-100 h-100 justify-content-center mt-5">

                    <div className="loader">Loading...</div>

                </div>
            )
        } else {

            if(this.state.posts.length === 0) {

                return (
                    <div className="row">
                        <div className="col-12">
                            <div className="no-results text-center my-5">No posts yet!</div>
                        </div>
                    </div>
                )

            } else {

                return (
                    <div className="row">
                        {
                        this.state.posts.map(

                            (Post) =>
                                <Item key={ Post.id } ref={ Post.id } data={ Post } />
                            )
                        }
                    </div>
                )
            }


        }
    }

    render() {

        return [
            <FilterBar { ...this.props } key="filter-bar" path="/"/>,
            <div key="posts">{ this.renderPosts() }</div>,
            <div className="mb-4 mt-3 text-center loader-more" key="load-more">

                {
                    !this.state.loading && this.state.loading_more && !this.state.no_more_post? (

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
        search: state.search
    };

}


export default connect(mapStateToProps, {})(Home);
