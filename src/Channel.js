import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from '@steemit/steem-js';
import Item from './components/Item';
import moment from 'moment';
import { subscribe, unsubscribe, getSubs } from './actions/app';
import debounce from 'lodash.debounce';
import Avatar from './components/Avatar';
import { PAGESIZE_CHANNEL } from './config'
import { shouldDisplayPost } from './utils/Filter'
import { savePrevListingState } from './reducers/app';

class Channel extends Component {

    constructor(props) {

        super(props);

        this.pageSize = PAGESIZE_CHANNEL;

        this.scrollThreshold = 10;

        this.state = {
            posts: [],
            loading: true,
            author: this.props.match.params.filter.replace('@',''),
            loading_more: false,
            loading_account_info: true,
            no_more_post: false,
            account_info: [],
            followers: '---',
            subscribing: false,
            is_subbed: false,
            blockedUsers: [],
            dmcaContents: [],
        }

        this.loadMoreContent = this.loadMoreContent.bind(this);
        this.sub = this.sub.bind(this);
        this.unsub = this.unsub.bind(this);
        this.scrollListener = this.scrollListener.bind(this);
        this.url = this.props.history.location.pathname
        this.scrolled = false

    } 

    componentWillReceiveProps(nextProps, prevProps) { 
        
        if(nextProps.match.params.filter.replace('@','') !== this.state.author) {

            this.setState({
                author: nextProps.match.params.filter.replace('@',''),
                loading: true
            },
            () => {
                this.loadContent();
                this.getAccount();
                this.checkIfSubbed();
            });

        }

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

    getAccount() {

        /* Get account info */

        steem.api.getAccounts([this.state.author], (err, accounts) => {

            if(err || (accounts && accounts.length === 0)) {
                
                console.log("Invalid account!");

                this.setState({
                    account_info: '',
                    loading_account_info: false,
                    loading: false
                });

                return false; // Handle invalid account

            }

            let account_info = accounts[0];
            try {
                account_info.json_metadata = JSON.parse(accounts[0].json_metadata);
            } catch (error) {
                // in case meta data is empty or malformed
            }
            
            this.setState({
                account_info: account_info,
                loading_account_info: false
            });
            

            // Get the followers
         
            var self = this;
            steem.api.getFollowCount(this.state.author, function(err, result) {
                self.setState({
                    followers: result.follower_count,
                });
            });

        });

    }

    componentWillUnmount() {
        this.detachScrollListener();
        this.saveState()
    }

    saveState() {
        this.props.savePrevListingState(this.url, window.pageYOffset, this.state)
    }

    restoreState() {
        const prevListingState = this.props.app.prevListingState
        if (prevListingState && this.url === prevListingState.url) {
            this.setState(prevListingState.state)
            this.scrolled = false
            return true
        } else {
            this.scrolled = true
            return false
        }
    }

    componentDidUpdate() {
        if (!this.scrolled) {
            window.scrollTo(0, this.props.app.prevListingState.scrollYPosition)
            this.scrolled = true
        }
    }

    componentDidMount() {

        if (!this.restoreState()) {
            this.loadContent();
            this.getAccount();
            this.checkIfSubbed();
        }

        this.attachScrollListener();

    }

    checkIfSubbed() {

        if(!this.props.app.username) return;

        this.props.getSubs({
            username: this.props.app.username,
            amount: 1000
        }).then( response => {

            let following = this.props.app.subs.find(o => o.following === this.state.author);

            if(following) {
                this.setState({
                    is_subbed: true
                });
            } else {
                this.setState({
                    is_subbed: false
                });
            }
           


        }).catch(err => {

            console.log("gotSubs error", err);

        });

    }


    loadContent() {

        let query = {
            'tag': this.state.author,
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
            'tag': this.state.author,
            'limit': this.pageSize + 1,
            'start_author': this.state.author,
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

    getSubs() {
        if(this.props.app.authorized && this.props.app.username === this.state.author) {
            return null;
        }
        if(this.state.is_subbed) {
            return (    
                <button disabled={this.state.subscribing} onClick={() => this.unsub()} className="btn btn-secondary">Unfollow</button>
            )
        } else {
            return (    
                <button disabled={this.state.subscribing} onClick={() => this.sub()} className="btn btn-danger">Follow</button>
            )
        }
    }

    unsub() {
        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        this.setState({
            subscribing: true
        })

        this.props.unsubscribe({
            postingWif: this.props.app.postingWif,
            username: this.props.app.username, 
            following: this.state.author
        }).then( response => {
            console.log("unSubbed success", response);

            this.checkIfSubbed(); // refresh following list

            this.setState({
                subscribing: false,
                is_subbed: false,
                followers: this.state.followers - 1
            })
        }).catch(err => {
            console.log("unSubbed error", err)

            this.setState({
                subscribing: false
            })
        });
    }

    sub() {
        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        this.setState({
            subscribing: true
        })

        this.props.subscribe({
            postingWif: this.props.app.postingWif,
            username: this.props.app.username, 
            following: this.state.author
        }).then( response => {
            console.log("subSuccess success", response);

            this.checkIfSubbed(); // refresh following list

            this.setState({
                subscribing: false,
                is_subbed: true,
                followers: this.state.followers + 1
            })
        }).catch(err => {
            console.log("subSuccess error", err)
            this.setState({
                subscribing: false
            })
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

    getFollowerCount () {
        if (this.state.followers > 0) {
            return (<small className="payout"><em>{this.state.followers} {this.state.followers > 1 ? "followers" : "follower"}</em></small>);
        } else {
            return;
        }
    }

    renderChannelHeader() {
        if(!this.state.loading_account_info) {
            if(!this.state.account_info) {
                return (
                    <div className="row">
                        <div className="col-12">
                            <div className="no-results my-5 text-center">
                                Account not found!
                            </div>
                        </div>
                    </div>
                )
            } else {
                let avatar = null;
                if (this.state.account_info.json_metadata.profile) {
                    avatar = this.state.account_info.json_metadata.profile.profile_image;
                }
                return (
                    <div className="row mt-3 video-info align-items-center mb-3 no-gutters">
                        <div className="col-8 col-sm-9">
                            <div className="row align-items-center no-gutters">
                                <div className="col-md-2 col-4">
                                    <div className="d-flex justify-content-center w-100">
                                        <div>
                                            <Avatar profile_image={avatar} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-10 col-8">
                                    <h2>{this.state.account_info.name}</h2>
                                    {this.getFollowerCount()}
                                    <div className="payout small row no-gutters">
                                        <div className="col-sm-auto col-12">Member since <span className="font-weight-bold">{ moment(this.state.account_info.created).format('MMMM YYYY') }</span></div><div className="col-sm-auto d-none d-sm-block px-1">&middot;</div><div className="col-sm-auto col-12">{ this.state.account_info.post_count } Posts</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-4 col-sm-3 text-right pr-3">
                            {this.getSubs()}
                        </div>
                    </div>
                )
            }

        } else {
            return null;
        }
    }

    render() {
        
        return [
            <div className="channel-view" key="video-post">
                { this.renderChannelHeader() }
            </div>,
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
        app: state.app,
        blockedUsers: state.app.blockedUsers,
        dmcaContents: state.app.dmcaContents,
    };
}

const mapDispatchToProps = (dispatch) => ({
    subscribe, 
    unsubscribe, 
    getSubs,
    savePrevListingState: (url, scrollYPosition, state) => {
        dispatch(savePrevListingState(url, scrollYPosition, state))
    }
})

export default connect(mapStateToProps, mapDispatchToProps)(Channel);
