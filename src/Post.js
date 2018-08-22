import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { Player, BigPlayButton } from 'video-react';
import { Link } from 'react-router-dom';
import { vote, comment } from './actions/post';
import moment from 'moment';
import HLSSource from './HLS';
import Item from './components/Item';
import Avatar from './components/Avatar';
import Comments from './components/Comments';
import { VIDEO_THUMBNAIL_URL_PREFIX } from './config'

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
            permalink: this.props.match.params.permalink
        }

        this.castVote = this.castVote.bind(this);
    } 

    componentWillReceiveProps(nextProps) {
        if(nextProps.match.params.permalink !== this.state.permalink) {

            this.setState({
                loading: true
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
    
    getVotes(votes) {
        if(votes) {
            return (
                <button disabled={this.state.voting} onClick={() => this.castVote(this.props.match.params.permalink, this.props.match.params.author, "post")} className="btn btn-danger btn-sm">Like <span className="votes font-weight-bold">{votes.length}</span></button>
            )
        }
    }

    castVote(permalink, author, type) {

        // type: post or comment

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
            weight: 10000

        }).then( response => {

            console.log("castVote success", response);

            if(type === "post") 
                this.state.post.active_votes.push({'dummy': 'data'})
            else {
                console.log("Upvoting comment")
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
 
                this.setState({
                    loading_related: false,
                    related: result
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

    displayPayoutAmount(amount) {
        if(amount) return parseInt(amount.replace(' SBD',''), 10).toFixed(2);
    }

    renderVideoPlayer() {

        if(this.state.post.json_metadata.vit_data) {

            //let hash = this.state.post.json_metadata.vit_data.Hash;
            //let filename = this.state.post.json_metadata.vit_data.Name;
            let playlist = this.state.post.json_metadata.vit_data.Playlist;

            return (

                <Player playsInline>
                {/*<PosterImage poster={ "https://media.vit.tube/playback/" +  thumbnail } />*/}
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
                    <div className="col-9">
                        <div className="row align-items-center">
                            <div className="col-3 col-md-2">
                                <div>
                                    <div>
                                        <Avatar profile_image={avatar} />
                                        <div className="username text-center">
                                            <Link to={ "/@" + this.state.post.author }>
                                                { this.state.post.author }
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-9 col-md-10">
                                <h2>{ this.state.post.title }</h2>
                                    <div className="payout small">
                                        Pending Payout: <span className="font-weight-bold">${ this.displayPayoutAmount(this.state.post.pending_payout_value) }</span> <br/> { moment.utc(this.state.post.created).tz( moment.tz.guess() ).fromNow() } &middot; <Link  className="font-weight-bold" to={"/" + this.state.post.category + "/new"}>{this.state.post.category}</Link>
                                    </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-3 text-right">
                        { this.getVotes(this.state.post.active_votes) }
                    </div>
                </div>
            ]
        }

    }

    render() {
        
        return (
            <div className="row justify-content-center mt-3">
                <div className="col-lg-9 col-md-12 video-post">

                    {
                        !this.state.loading ? (

                            <span>{ this.renderVideoInfo() }</span>   
                            
                        ) : (
                            <div className="row w-100 h-100 justify-content-center mt-5">
                                <div className="loader">Loading...</div>
                            </div>
                        )
                    
                    }

                    {
                        this.state.post ? (
                            <Comments
                                matchParams={this.props.match.params}
                                castVote={this.castVote}
                                post={this.state.post}
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
        app: state.app
    };
    
}


export default connect(
    mapStateToProps,
    (dispatch) => {
        return { vote, comment, dispatch }
    }
)(Post);
