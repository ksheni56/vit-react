import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import FilterBar from './components/FilterBar';
import Item from './components/Item';
import debounce from 'lodash.debounce';
import { PAGESIZE_TAG } from './config'

class Tag extends Component {

    constructor(props) {

        super(props);

        this.pageSize = PAGESIZE_TAG;

        this.scrollThreshold = 10;

        this.state = {
            posts: [],
            loading: true,
            tag: this.props.match.params.tag,
            filter: this.props.match.params.filter,
            no_more_post: false,
            loading_more: false
        }

        this.loadMoreContent = this.loadMoreContent.bind(this);

    }

    componentDidMount() {

        this.loadContent(this.props.match.params.tag, this.props.match.params.filter)
        this.attachScrollListener();

    }

    componentWillReceiveProps(nextProps) {

        if( nextProps.match.params.tag !== this.state.tag || nextProps.match.params.filter !== this.state.filter ) {
            this.setState({
                tag: nextProps.match.params.tag,
                filter: nextProps.match.params.filter,
                loading: true
            },
            () => {
                this.loadContent(this.state.tag, this.state.filter);
            });

        }

    }

    attachScrollListener() {
        window.document.getElementById('vitContent').addEventListener('scroll', this.scrollListener, {
            capture: false,
            passive: true,
        });
    }

    detachScrollListener() {
        window.document.getElementById('vitContent').removeEventListener('scroll', this.scrollListener)
    }

    scrollListener = debounce(() => {
        const el = window.document.getElementById('vitContent');
        if (!el) return;
        if(el.offsetHeight + el.scrollTop + this.scrollThreshold >= el.scrollHeight) {
            this.loadMoreContent();
        }
    }, 150)

    loadMoreContent () {

        if (this.state.loading_more || this.state.no_more_post) return;

        this.setState({
            loading_more: true
        })

        let load_more_query =  {
            'tag': this.state.tag,
            'limit': this.pageSize + 1,
            'start_author': this.state.posts[this.state.posts.length - 1].author,
            'start_permlink': this.state.posts[this.state.posts.length - 1].permlink
        }

        if(this.state.filter === 'trending') {

            steem.api.getDiscussionsByTrending(load_more_query, (err, result) => {

                result.splice(0, 1);
                let all_posts = this.state.posts.concat(result);

                this.setState({
                    posts: all_posts,
                    no_more_post: result.length < this.pageSize,
                    'loading_more': false
                })

            });

        } else if(this.state.filter === 'new') {

            steem.api.getDiscussionsByCreated(load_more_query, (err, result) => {

                result.splice(0, 1);
                let all_posts = this.state.posts.concat(result);

                this.setState({
                    posts: all_posts,
                    no_more_post: result.length < this.pageSize,
                    'loading_more': false
                });


            });

        } else if(this.state.filter === 'hot') {

            steem.api.getDiscussionsByHot(load_more_query, (err, result) => {

                result.splice(0, 1);
                let all_posts = this.state.posts.concat(result);

                this.setState({
                    posts: all_posts,
                    no_more_post: result.length < this.pageSize,
                    'loading_more': false
                })

            });

        } 
    }

    loadContent(tag, filter) {

        let query = {
            'tag': tag,
            'limit': this.pageSize,
        }

        if(filter === 'trending') {

            steem.api.getDiscussionsByTrending(query, (err, result) => {

                this.setState({
                    posts: result,
                    no_more_post: result.length < this.pageSize,
                    loading: false
                });

            });

        } else if(filter === 'new') {

            steem.api.getDiscussionsByCreated(query, (err, result) => {

                console.log("err, result", err, result)

                this.setState({
                    posts: result,
                    no_more_post: result.length < this.pageSize,
                    loading: false
                });

            });

        } else if(filter === 'hot') {

            steem.api.getDiscussionsByHot(query, (err, result) => {

                this.setState({
                    posts: result,
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
            <FilterBar { ...this.props } key="filter-bar" path={ "/" + this.state.tag + "/" } />,
            <div key="posts">{ this.renderPosts() }</div>,
            <div className="mb-4 mt-1 text-center" key="load-more">

                {
                    !this.state.loading && this.state.loading_more && !this.state.no_more_post? (

                        <i className="fas fa-spinner fa-pulse"></i>

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


export default connect(mapStateToProps, {})(Tag);
