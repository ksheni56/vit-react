import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from '@steemit/steem-js';
import { Player, BigPlayButton } from 'video-react';
import { Link } from 'react-router-dom';
import { vote, comment } from './actions/post';
import moment from 'moment';
import HLSSource from './HLS';
import Item from './components/Item';
import Avatar from './components/Avatar';
import Comments from './components/Comments';
import { VIDEO_THUMBNAIL_URL_PREFIX, LIQUID_TOKEN, AVATAR_UPLOAD_PREFIX, SCREENSHOT_IMAGE } from './config';
import { shouldDisplayPost } from './utils/Filter';
import { displayPayoutAmount } from './utils/Format';
import BlockUi from 'react-block-ui';

class Post extends Component {

    constructor(props) {

        super(props);

        this.state = {
            post: '',
            loading: true,
            voting: false,
            related: [],
            loading_related: true,
            tag: this.props.match.params.tag,
            author: this.props.match.params.author,
            permalink: this.props.match.params.permalink,
            commentForPost: false
        }

        this.castVote = this.castVote.bind(this);
        this.getVotes = this.getVotes.bind(this);
        this.togglePostReply = this.togglePostReply.bind(this);
    } 

    componentWillReceiveProps(nextProps) {
        if(nextProps.match.params.permalink !== this.state.permalink) {

            this.setState({
                loading: true,
                author: nextProps.match.params.author,
                permalink: nextProps.match.params.permalink,
                commentForPost: false
            })

            this.loadContent(nextProps.match.params.author, nextProps.match.params.permalink)
        }

        if(!nextProps.app.username && !nextProps.app.publicWif) {
            // got logged out
        }
    }

    componentDidMount() {
        let { author, permalink } = this.props.match.params;
        this.loadContent(author, permalink);
    }

    togglePostReply() {
        this.setState({
            commentForPost: !this.state.commentForPost
        })
    }
    
    getVotes(data, type = 'post') {
        let votes = data.active_votes;
        let btnLike;

        if (data.net_votes > 0) {
            let voted;
            voted = votes.filter(vote => {
                return (vote.voter === this.props.app.username ? vote : null);
            })
            
            // AS DOWNVOTE does not remove a record out of the active_votes
            // So we need to check the percent as well
            if (voted.length > 0 && voted[0].percent > 0) {
                btnLike = 
                    <span className="badge badge-pill badge-danger btn-like" onClick={() => this.castVote(data.permlink, data.author, type, 0)}>Unlike</span>
            } else {
                btnLike = 
                <span className="badge badge-pill badge-danger btn-like" onClick={() => this.castVote(data.permlink, data.author, type, 10000)}>Like</span>
            }

        } else {
            btnLike = 
                <span className="badge badge-pill badge-danger btn-like" onClick={() => this.castVote(data.permlink, data.author, type, 10000)}>Like</span>
        }

        return btnLike;
    }

    castVote(permalink, author, type, weight) {
        
        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        this.setState({
            voting: true
        });

        this.props.vote({

            postingWif: this.props.app.postingWif,
            username: this.props.app.username, 
            author: author,
            permalink: permalink,
            weight: weight

        }).then( response => {

            console.log("castVote success", response);

            if(type === "post") {
                this.loadContent(this.state.author, this.state.permalink);
                console.log("Update post voting");
            }
            else {
                console.log("Update comment voting");
            }

            this.setState({
                voting: false
            });

        }).catch(err => {
            console.log("castVote error", err)

            this.setState({
                voting: false
            });
        });

    }

    loadContent(author, permalink) {
        steem.api.getContent(author, permalink, (err, result) => {

            console.log("getContent response", err, result)

            let post = result;

            if(err || post.author === '') {

                this.setState({
                    loading_related: false,
                    related: [],
                    loading: false,
                    post: ''
                });

                return false;
            }
            
            try {
                post.json_metadata = JSON.parse(result.json_metadata);
            } catch (error) {
                // in case meta data is empty or malformed
            }

            steem.api.getDiscussionsByAuthorBeforeDate(author.replace('@',''), permalink, post.active, 5, (err, result) => {

                result.splice(0, 1);

                let related_posts = [];

                result.forEach((item) => {
                    if(shouldDisplayPost(this.props, item, related_posts))
                        related_posts.push(item)
                })

                this.setState({
                    loading_related: false,
                    related: related_posts
                });


            });

            steem.api.getAccounts([post.author], (err, result) => {

                console.log(">>>", err, result)

                post.author_profile = result[0];
                try {
                    post.author_profile.json_metadata = JSON.parse(result[0].json_metadata);
                } catch (error) {
                    // in case meta data is empty or malformed
                }

                this.setState({
                    loading: false,
                    post: post
                });

            });

        });

    }

    displayRelatedContent() {

        if(this.state.related.length > 0) {

            return (
                <ul className="list-unstyled">
                    { 

                    this.state.related.map(

                        (Related) =>
                            <li key={ Related.id } ref={ Related.id }>

                                <Item key={ Related.id } ref={ Related.id } data={ Related } />

                            </li>
                        ) 

                    }
                </ul>
            )

        } else {

            return (
                <div className="alert alert-dark mb-0" role="alert">
                    No related videos yet...
                </div>
            )

        }

    }

    renderVideoPlayer() {

        if(this.state.post.json_metadata.vit_data &&
            this.state.post.json_metadata.vit_data.Hash &&
            this.state.post.json_metadata.vit_data.Playlist) {
            const vit_data = this.state.post.json_metadata.vit_data;
            let playlist = vit_data.Playlist;
            let screenShot;
            if (vit_data.Screenshot === undefined) {
                // for videos already on production, we use the default one
                screenShot = VIDEO_THUMBNAIL_URL_PREFIX + vit_data.Hash + "/thumbnail-01.jpg";
            } else {
                screenShot = AVATAR_UPLOAD_PREFIX + vit_data.Screenshot + '/' + SCREENSHOT_IMAGE;
            }
            return (

                <Player playsInline 
                    poster={screenShot}
                >
                    <HLSSource
                        isVideoChild
                        src={ VIDEO_THUMBNAIL_URL_PREFIX + playlist }
                    />
                    <BigPlayButton position="center" />
                </Player>

            )
        
        } else {

            return (
                <div className="row">
                    <div className="col-12">
                        <div className="no-results my-5 text-center">
                            This is not a VIT post!
                        </div>
                    </div>
                </div>
            )
        }
        
    }  

    renderVideoInfo() {

        if(!this.state.post) {

            return (
                <div className="row">
                    <div className="col-12">
                        <div className="no-results my-5 text-center">
                            Post not found!
                        </div>
                    </div>
                </div>
            )

        } else {
            let avatar = null;
            if (this.state.post.author_profile.json_metadata.profile) {
                avatar = this.state.post.author_profile.json_metadata.profile.profile_image;
            }
            return [

                <div key="video-player">{ this.renderVideoPlayer() }</div>,

                <div className="row mt-3 video-info align-items-center" key="video-info">
                    <div className="col-12">
                        <div className="row align-items-center">
                            <div className="col-3 col-md-2">
                                <div>
                                    <div>
                                        <Avatar profile_image={avatar} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-9 col-md-10">
                                <h2>{ this.state.post.title }</h2>
                                <div className="payout small">
                                    Pending Payout: <span className="font-weight-bold">{ displayPayoutAmount(this.state.post) }</span> <br/> { moment.utc(this.state.post.created).tz( moment.tz.guess() ).fromNow() } by <Link to={ "/@" + this.state.post.author } className="username text-center">{ this.state.post.author }</Link> 
                                </div>
                                <div className="payout small">
                                    Category: <Link  className="font-weight-bold" to={"/" + this.state.post.category + "/new"}>{this.state.post.category}</Link>
                                </div>
                                <div className="votes">
                                    {this.getVotes(this.state.post)} | {this.state.post.net_votes} Votes | <button className="btn btn-link btn-sm px-0 reply-button" onClick={() => this.togglePostReply()}>Reply</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ]
        }

    }

    render() {
        let loading = this.state.loading;

        if (this.props.dmcaContents == null || this.props.blockedUsers == null) {
            loading = true
        } else {
            // skip displaying video if blocked
            const { author, permlink } = this.state.post;
            const url = `@${author}/${permlink}`;

            if (this.props.dmcaContents.includes(url) || 
                    this.props.blockedUsers.includes(author)) {
                return (
                    <div className="row">
                        <div className="col-12">
                            <div className="no-results my-5 text-center">
                                This post is not available due to a copyright claim.
                            </div>
                        </div>
                    </div>
                )
            }
        }
        
        // display video
        return (
            <div className="row justify-content-center mt-3">
                <div className="col-lg-9 col-md-12 video-post">

                    {
                        !loading ? (

                            <span>{ this.renderVideoInfo() }</span>   
                            
                        ) : (
                            <div className="row w-100 h-100 justify-content-center mt-5">
                                <div className="loader">Loading...</div>
                            </div>
                        )
                    
                    }

                    {
                        !loading && this.state.post ? (

                            <Comments
                                {...this.props}
                                matchParams={this.props.match.params}
                                post={this.state.post}
                                commentForPost={this.state.commentForPost}
                                togglePostReply={this.togglePostReply}
                                getVotes={this.getVotes}
                            />
                          
                        ) : null
                    }
                    
                </div>
                <div className="col-lg-3 col-md-12 related-videos">
                    <h3>Related Videos</h3>

                    {
                        !this.state.loading_related ? (
                            
                            <div>{ this.displayRelatedContent() }</div>

                        ) : (
                            <div className="text-center">
                                Loading...
                            </div>
                        )
                    
                    }

                </div>
            </div>
        )
        
    }

}

function mapStateToProps(state) {

    return { 
        search: state.search,
        app: state.app,
        dmcaContents: state.app.dmcaContents,
        blockedUsers: state.app.blockedUsers
    };
    
}


export default connect(
    mapStateToProps,
    (dispatch) => {
        return { vote, comment, dispatch }
    }
)(Post);
