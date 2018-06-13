import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { Player, BigPlayButton } from 'video-react';
import { NavLink, Link } from 'react-router-dom';
import { vote, comment } from './actions/post';
import Formsy from 'formsy-react';
import moment from 'moment';
import TextArea from './components/forms/TextArea';

class Post extends Component {

    constructor(props) {

        super(props);

        this.state = {
            post: '',
            loading: true,
            loading_comments: true,
            commenting: false,
            comments: [],
            voting: false,
            related: [],
            loading_related: true,
            tag: this.props.match.params.tag,
            author: this.props.match.params.author,
            permalink: this.props.match.params.permalink
        }

        this.castVote = this.castVote.bind(this);
        this.submitComment = this.submitComment.bind(this);

    } 



    componentWillReceiveProps(nextProps) { 


        if(nextProps.match.params.permalink != this.state.permalink) {

            this.loadContent(nextProps.match.params.author, nextProps.match.params.permalink)

        }

        if(!nextProps.app.username && !nextProps.app.publicWif) {
            // got logged out
        }


    }

    componentDidMount() {

        this.loadContent(this.props.match.params.author, this.props.match.params.permalink)

    }

    getVotes(votes) {

        if(votes) {
            return (
                <button disabled={this.state.voting} onClick={() => this.castVote()} className="btn btn-danger">Like <span className="votes font-weight-bold">{votes.length}</span></button>
            )
        }
        
    }

    castVote() {

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
            author: this.props.match.params.author,
            permalink: this.props.match.params.permalink,
            weight: 10000

        }).then( response => {

            console.log("castVote success", response);

            this.state.post.active_votes.push({'dummy': 'data'})

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

    submitComment(form) {

        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        this.setState({
            commenting: true
        });

        this.props.comment({

            postingWif: this.props.app.postingWif,
            username: this.props.app.username, 
            author: this.props.match.params.author,
            permalink: this.props.match.params.permalink,
            comment: form.comment

        }).then( response => {

            console.log("comment submit success", response);

            this.state.comments.unshift({
                id: new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase(),
                author: response.payload.operations[0][1].parent_author,
                body: response.payload.operations[0][1].body,
                created: new Date()
            })

            this.setState({
                commenting: false
            });


        }).catch(err => {

            console.log("comment submit error", err)

            this.setState({
                commenting: false
            });

        });

    }


    loadContent(author, permalink) {

        steem.api.getContentReplies(author, permalink, (err, result) => {

            if(err) {
                
                this.setState({
                    loading_comments: false,
                    comments: []
                });

                return false;

            }

            console.log("Got comments", result)

            this.setState({
                loading_comments: false,
                comments: result
            });

        });

        steem.api.getContent(author, permalink, (err, result) => {

            let post = result;

            //console.log("post", post)

            if(err) {

                this.setState({
                    loading_related: false,
                    related: [],
                    loading: false,
                    post: ''
                });

                return false;
            }

            steem.api.getDiscussionsByAuthorBeforeDate(author.replace('@',''), permalink, post.active, 5, (err, result) => {
                
                result.splice(0, 1);
 
                this.setState({
                    loading_related: false,
                    related: result
                });


            });

            steem.api.getAccounts([post.author], (err, result) => {

                post.author_profile = result[0];
                post.author_profile.json_metadata = JSON.parse(result[0].json_metadata);

                this.setState({
                    loading: false,
                    post: post
                });

            });

        });

    }

    displayComments() {

        if(this.state.comments.length > 0) {

            return (
                <ul className="list-unstyled">
                    { 

                    this.state.comments.map(

                        (Comment) =>
                            <li key={ Comment.id } ref={ Comment.id } className="media mb-4">

                                <div className="mr-3 avatar"></div>

                                <div className="media-body">
                                    <h5 className="mt-0 mb-1">{ Comment.author }</h5>
                                    <span>{ Comment.body }</span>
                                    <div className="text-muted small">{ moment.utc(Comment.created).tz( moment.tz.guess() ).fromNow() }</div>
                                </div>
                                

                            </li>
                        ) 

                    }
                </ul>
            )

        } else {

            return (
                <div className="alert alert-dark mb-0" role="alert">
                    No comments yet...
                </div>
            )

        }

    }

    displayRelatedContent() {

        if(this.state.related.length > 0) {

            return (
                <ul className="list-unstyled">
                    { 

                    this.state.related.map(

                        (Related) =>
                            <li key={ Related.id } ref={ Related.id }>

                                <Link to={ '/@' + Related.author + '/' + Related.permlink }>
                                    <h4>{ Related.title }</h4>
                                    <img src="/images/thumbnail.jpg" className="img-fluid"/>
                                </Link>
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
        if(amount) return parseInt(amount.replace(' SBD','')).toFixed(2);
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

            return [

                <Player
                    playsInline
                    key="video-player"
                    src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4">
                    <BigPlayButton position="center" />
                </Player>,

                <div className="row mt-3 video-info align-items-center" key="video-info">
                    <div className="col-9">
                        <div className="row align-items-center">
                            <div className="col-md-2 col-12">
                                <div className="d-flex justify-content-center w-100">
                                    <div>
                                        <div className="avatar" style={{'background': 'url( https://steemitimages.com/100x100/' + this.state.post.author_profile.json_metadata.profile.profile_image + ' ) no-repeat center center', 'backgroundSize': 'cover'}}></div>
                                        <div className="username text-center">{ this.state.post.author }</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-10 col-12">
                                <h2>{ this.state.post.title }</h2>
                                    <div className="payout small">
                                        Pending Payout: <span className="font-weight-bold">${ this.displayPayoutAmount(this.state.post.pending_payout_value) }</span> &middot; { moment.utc(this.state.post.created).tz( moment.tz.guess() ).fromNow() }
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
                <div className="col-9 video-post">


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

                            <div className="row my-4 comments">

                                <div className="col-12">

                                    <Formsy 
                                        onValidSubmit={this.submitComment} 
                                        ref="comment_form" 
                                        >

                                        <TextArea 
                                            name="comment"
                                            id="comment"
                                            label="Your comment"
                                            value={this.state.comment_text}
                                            placeholder="Type here..." 
                                            required />

                                        <button type="submit" className="btn btn-danger" disabled={this.state.commenting || this.state.submitting}>Submit</button>

                                    </Formsy>

                                </div>

                            </div>
                        ) : null

                    }

                    

                    {
                        (!this.state.loading_comments && !this.state.loading) ? (
                            <span>
                                {
                                    this.state.post ? (

                                        <div className="row mt-3 comments mb-3">
                                            <div className="col-12">
                                                <h3 className="mb-4">Comments <span>({this.state.comments.length})</span></h3>
                                            </div>
                                            <div className="col-12">
                                                { this.displayComments() }
                                            </div>
                                        </div>

                                    ) : null

                                }   
                            </span>
                            

                        ) : (
                            <div className="row w-100 h-100 justify-content-center mt-5">
                                <div className="text-center">Loading comments...</div>
                            </div>
                        )
                    
                    }

                    

                </div>
                <div className="col-3 related-videos pl-0">
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


export default connect(mapStateToProps, { vote, comment })(Post);
