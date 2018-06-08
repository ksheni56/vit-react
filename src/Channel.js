import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import Item from './components/Item';
import moment from 'moment';
import { subscribe } from './actions/app';

class Channel extends Component {

    constructor(props) {

        super(props);

        this.state = {
            posts: [],
            loading: true,
            author: this.props.match.params.filter.replace('@',''),
            loading_more: false,
            loading_account_info: true,
            account_info: [],
            followers: '---',
            subscribing: false,
            is_subbed: false
        }

        this.loadMoreContent = this.loadMoreContent.bind(this);
        this.sub = this.sub.bind(this);

    } 

    shouldComponentUpdate(nextProps, nextState) {

        console.log("nextProps", nextProps)
        console.log("nextState", nextState)
        console.log("--------------")

        return true
        
    }

    componentDidMount() {

        /*
        steem.api.getFollowing('sundaybaking', '', 'blog', 1000, function(err, result) {
            console.log("x",err, result);
        });
        */

        //let obj = this.props.app.subs.find(o => o.following === this.state.author);

        //console.log("AM I FOLLOWING", obj)

        this.loadContent();

        /* Get account info */

        steem.api.getAccounts([this.state.author], (err, accounts) => {

            if(accounts.length == 0) {
                
                console.log("Invalid account!");
                return; // Handle invalid account

            }

            let account_info = accounts[0]; console.log("account_info", account_info)
            account_info.json_metadata = JSON.parse(accounts[0].json_metadata);

            /*
            this.setState({
                account_info: account_info,
                loading_account_info: false
            });
            */

            /* Get followers */
            /*
            var self = this;
            steem.api.getFollowCount(this.state.author, function(err, result) {
                self.setState({
                    followers: result.follower_count,
                });
            });
            */

        });

    }


    loadContent() {

        let query = {
            'tag': this.state.author,
            'limit': 30
        };

        steem.api.getDiscussionsByBlog(query, (err, result) => {

            /*
            this.setState({
                posts: result,
                loading: false
            });
            */

        });

    }

    loadMoreContent() {

        let load_more_query = {
            'tag': this.state.author,
            'limit': 30,
            'start_author': this.state.author,
            'start_permlink': this.state.posts[this.state.posts.length - 1].permlink
        };


        var self = this;
        steem.api.getDiscussionsByBlog(load_more_query, (err, result) => {
            
            result.splice(0, 1);
            let all_posts = this.state.posts.concat(result);

            /*
            self.setState({
                posts: all_posts,
                loading: false
            });
            */

        });
    }

    getSubs() {

        return (
            <button disabled={this.state.subscribing} onClick={() => this.sub()} className="btn btn-danger">Subscribe <span className="font-weight-bold">{ this.state.followers }</span></button>
        )
        
    }

    sub() {

        this.setState({
            subscribing: true
        })

        this.props.subscribe({

            postingWif: this.props.app.postingWif,
            username: this.props.app.username, 
            following: this.state.author

        }).then( response => {

            console.log("subSuccess success", response);

            this.setState({
                subscribing: false
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

    renderChannelHeader() {

        if(!this.state.loading_account_info) {

            return (
                <div className="row mt-3 video-info align-items-center mb-3">
                    <div className="col-9">
                        <div className="row align-items-center">
                            <div className="col-md-2 col-12">
                                <div className="d-flex justify-content-center w-100">
                                    <div>
                                        <div className="avatar" style={{'background': 'url( https://steemitimages.com/100x100/' + this.state.account_info.json_metadata.profile.profile_image + ' ) no-repeat center center', 'backgroundSize': 'cover'}}></div>
                                        <div className="username text-center">{this.state.account_info.name}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-10 col-12">
                                <h2>{this.state.account_info.name}</h2>
                                <div className="payout small">
                                    Member since <span className="font-weight-bold">{ moment(this.state.account_info.created).format('MMMM YYYY') }</span> &middot; { this.state.account_info.post_count } Posts
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-3 text-right">
                        {this.getSubs()}
                    </div>
                </div>
            )

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
            <div className="mb-4 mt-1 text-center" key="load-more">

                {
                    !this.state.loading ? (

                        <button className="btn btn-dark"  onClick={(e) => this.loadMoreContent(e)} disabled={this.state.loading_more}>
                            {
                                !this.state.loading_more ? (
                                    <strong>Load More</strong>
                                ) : (
                                    <strong>Loading...</strong>
                                )
                            }
                        </button>  

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
        app: state.app
    };
    
}


export default connect(mapStateToProps, { subscribe })(Channel);
