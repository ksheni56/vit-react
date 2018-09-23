import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from '@steemit/steem-js';
import moment from 'moment'
import Formsy from 'formsy-react';
import TextArea from './forms/TextArea';
import { vote, comment } from '../actions/post';
import { Promise } from 'bluebird';
import { AVATAR_UPLOAD_PREFIX } from '../config';
import Avatar from './Avatar';
import BlockUi from 'react-block-ui';

class Comments extends Component {
    constructor(props) {
        super(props);

        this.state = {
            author: this.props.matchParams.author,
            permalink: this.props.matchParams.permalink,
            loading_comments: true,
            commenting: false,
            comments: [],
            post: this.props.post,
            replyTarget: [this.props.matchParams.author, this.props.matchParams.permalink].join('|')
        }
        
        this.submitComment = this.submitComment.bind(this);
        this.setReplyTarget = this.setReplyTarget.bind(this);
        this.getReplyTarget = this.getReplyTarget.bind(this);
        this.searchTargetLinkComment = this.searchTargetLinkComment.bind(this);
    }

    componentDidMount() {

        this.props.dispatch({
            type: 'START_BACKGROUND_SYNC_COMMENTS',
		    callback: () => {
                console.log("Syncing comments on " + this.state.permalink);
                this.loadComments();
            },
        });

    }

    componentWillUnmount() {
        this.props.dispatch({
            type: 'STOP_BACKGROUND_SYNC_COMMENTS',
        });
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.matchParams.permalink !== this.state.permalink) {

            this.props.dispatch({
                type: 'STOP_BACKGROUND_SYNC_COMMENTS',
            });

            this.setState({
                author: nextProps.matchParams.author,
                permalink: nextProps.matchParams.permalink,
                comments: [],
                loading_comments: true
            });

            this.props.dispatch({
                type: 'START_BACKGROUND_SYNC_COMMENTS',
                callback: () => {
                    console.log("Syncing comments on " + nextProps.matchParams.permalink);
                    this.loadComments();
                }
            });
        }
    }

    setReplyTarget(value) {
        
        // set state to reply target with value
        this.setState({
            replyTarget: value

        });
    }

    getReplyTarget() {
        const commentAuthorAndPermLink = this.state.replyTarget;
        const [targetAuthor, targetPermlink] = commentAuthorAndPermLink.split("|");
        console.log('initial', targetAuthor, targetPermlink);
        return { "targetAuthor": targetAuthor, "targetPermlink": targetPermlink};
    }

    searchTargetLinkComment(index, comment, targetPermlink) {

        if (comment.permlink === targetPermlink) {
            return this.state.comments[index].replies;
        } else {
            if (comment.children > 0) {
                return comment.replies.map((c, i) => {
                    return this.searchTargetLinkComment(i, c, targetPermlink);
                })
            }
        }
    }

    submitComment(form) {
        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        const { targetAuthor, targetPermlink } = this.getReplyTarget();
        console.log(targetAuthor, targetPermlink);
        this.setState({
            commenting: true
        });

        this.props.comment({
            postingWif: this.props.app.postingWif,
            username: this.props.app.username, 
            author: targetAuthor,
            permalink: targetPermlink,
            comment: form.comment
        }).then( response => {
            console.log("comment submit success", response);
            
            const responseData = response.payload.operations[0][1];
            const parentPermlink = responseData.parent_permlink;
            if (parentPermlink === this.state.permalink) {
                // close the replybox of post
                this.props.togglePostReply();
            } else {
                // reload the comments again
                this.setReplyTarget([this.state.author, this.state.permalink].join('|'));
            }

            this.setState({
                commenting: false,
                // initial to comment on the post instead of nested replies
                replyTarget: [this.props.matchParams.author, this.props.matchParams.permalink].join('|')
            });

            

            // const responseData = response.payload.operations[0][1];
            // const parentPermlink = responseData.parent_permlink;
            // if (parentPermlink === this.state.permalink) {
            //     // add as the top comment of post
            //     // this.state.comments.unshift({
            //     //     id: new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase(),
            //     //     author: responseData.author,
            //     //     body: responseData.body,
            //     //     created: new Date()
            //     // });

                

            // } else {
            //     // reload the comments again
            //     this.setReplyTarget([this.state.author, this.state.permalink].join('|'));
            //     this.loadComments();
            // }

            // this.setState({
            //     commenting: false,
            //     // initial to comment on the post instead of nested replies
            //     replyTarget: [this.props.matchParams.author, this.props.matchParams.permalink].join('|')
            // });

        }).catch(err => {
            console.log("comment submit error", err)

            this.setState({
                commenting: false,
                // initial post author and permlink
                replyTarget: [this.props.matchParams.author, this.props.matchParams.permalink].join('|')
            });
            
        });
    }

    // render Comment Input Box
    renderCommentBox(mainComment = true) {
        return (
            <BlockUi tag="div" blocking={this.state.commenting}>
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
                                placeholder="Type here..." 
                                value={this.state.comment_text}
                                required />
                            <input type="hidden" name="info" value={this.state.replyTarget}></input>    
                                
                            <button type="submit" className="btn btn-danger">Submit</button>
                            {
                                mainComment ? (
                                    <a className="btn" onClick={() => this.props.togglePostReply()}>Cancel</a>
                                ) : (
                                    <a className="btn" onClick={() => this.setReplyTarget([this.state.author, this.state.permalink].join('|'))}>Cancel</a>
                                )
                            }
                        
                        </Formsy>
                    </div>
                </div>
            </BlockUi>
        )   
    }

    // load list of comments related to post
    loadComments() {

        let fetchVotes = (r) => {
            return new Promise((resolve, reject) => {
                steem.api.getContent(r.author, r.permlink, (err, result) => {
                    resolve(result);
                });
            });
        }

        let fetchReplies = function (author, permlink) {
            return new Promise((resolve, reject) => {
                steem.api.getContentReplies(author, permlink, (err, result) => {
                    let reply = Promise.map(result, function(r) {
                        if (r.children > 0) {
                            return fetchVotes(r).then(data => {
                                r.active_votes = data.active_votes;
                                return fetchReplies(r.author, r.permlink)
                                    .then(function(children) {
                                        r.replies = children;
                                        return r;
                                });
                            });
                        } else {
                            if (r.net_votes > 0) {
                                return fetchVotes(r).then(data => {
                                    r.active_votes = data.active_votes;
                                    return r;
                                });
                            } else {
                                return r;
                            }
                        }
                    });
                    resolve(reply);
                });
            });
        }

        fetchReplies(this.state.author, this.state.permalink)
            .then( replies => {
                this.setState({
                    loading_comments: false,
                    comments: replies
                });
            });
    }

    displayComments() {

        if(this.state.comments.length > 0) {

            return (
                <ul className="list-unstyled comments">
                    { 
                    this.state.comments.map(
                        (Comment) =>
                            <li key={ Comment.id } ref={ Comment.id } className="media mb-4">
                                <div className="mr-3 avatar">
                                    <Avatar 
                                        profile_image={AVATAR_UPLOAD_PREFIX + Comment.author + "/avatar"} 
                                    />
                                </div>
                                <div className="media-body">
                                    <h6 className="mt-0 mb-1">{ Comment.author }</h6>
                                    <span>{ Comment.body }</span>
                                    <div className="text-muted small d-flex align-items-center comment-meta"> 
                                        {/* TODO: Modify getVosts as get whether comments are voted or not */}
                                        {/* <button onClick={() => this.props.castVote(Comment.permlink, Comment.author, "comment")} className="btn btn-link btn-sm px-0">Like</button> */}
                                        {/* <button className="btn btn-link btn-sm px-0">Like</button> */}
                                        {/* {this.props.getVotes(Comment.active_votes)} */}
                                        {/* | <span className=""> {Comment.net_votes} Votes </span> */}
                                        {/* { moment.utc(Comment.created).tz( moment.tz.guess() ).fromNow() } &middot; <button onClick={() => this.props.castVote(Comment.permlink, Comment.author, "comment")} className="btn btn-link btn-sm px-0">Like</button> */}
                                        {/* | */}
                                        {/* <button className="btn btn-link btn-sm px-0" onClick={() => this.setReplyTarget([Comment.author, Comment.permlink].join('|'))}>Reply</button> */}

                                        {this.props.getVotes(Comment, "comment")} | {Comment.net_votes} Votes
                                        | <button className="btn btn-link btn-sm px-0" onClick={() => this.setReplyTarget([Comment.author, Comment.permlink].join('|'))}>Reply</button>

                                    </div>

                                    {/* render comment box if matched */}
                                    { 
                                        this.state.replyTarget === [Comment.author, Comment.permlink].join('|') && (
                                            this.renderCommentBox(false)
                                        )
                                    }

                                    {/* check and render the nested comments if any */}
                                    {
                                        Comment.children > 0 ? (
                                            <ul className="list-unstyled sub-comments">
                                                {this.renderNestedComments(Comment.replies)}
                                            </ul>
                                        ) : null
                                    }
                                    
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

    // render nested comments
    renderNestedComments(subComments) {
        
        let lists = subComments.map(comment => {
            return (
                <li key={comment.id} className="media mb-4">
                    <div className="mr-3 avatar">
                        <Avatar 
                            profile_image={AVATAR_UPLOAD_PREFIX + comment.author + "/avatar"} 
                        />
                    </div>
                    <div className="media-body">
                        <h6 className="mt-0 mb-1">{comment.author}</h6>
                        <span>{comment.body}</span>
                        <div className="text-muted small d-flex align-items-center comment-meta"> 
                            { moment.utc(comment.created).tz( moment.tz.guess() ).fromNow() } &middot;
                            {this.props.getVotes(comment, "comment")} | {comment.net_votes} Votes
                            | <button className="btn btn-link btn-sm px-0" onClick={() => this.setReplyTarget([comment.author, comment.permlink].join('|'))}>Reply</button>
                        </div>

                        {/* render comment box if matched */}
                        { 
                            this.state.replyTarget === [comment.author, comment.permlink].join('|') && (
                                this.renderCommentBox(false)
                            )
                        }

                        {/* check and render the nested comments if any */}
                        {
                            comment.children > 0 ? (
                                <ul className="list-unstyled sub-comments">
                                    {this.renderNestedComments(comment.replies)}
                                </ul>
                            ) : null
                        }

                    </div>
                </li>
            )
        })

        return lists;        
    }

    // render list of comments
    renderComments() {
        
        return (
            (!this.state.loading_comments) ? (
                <span>
                    <div className="row mt-3 comments mb-3">
                        <div className="col-12">
                            <h3 className="mb-4">Comments <span>({this.state.comments.length})</span></h3>
                        </div>
                        <div className="col-12">
                            { this.displayComments() }
                        </div>
                    </div>
                </span>
            ) : (
                <div className="row w-100 h-100 justify-content-center mt-5">
                    <div className="text-center">Loading comments...</div>
                </div>
            )
        )
    }

    render () {
        
        return (
            <div>
                {/* Render Comment Box */}
                {
                    this.props.commentForPost && (
                        this.renderCommentBox()        
                    )
                }
                {/* {this.renderCommentBox()} */}

                {/* Render lisf of comments */}
                {this.renderComments()}
            </div>
        )
    }
}

function mapStateToProps(state) {

    return { 
        app: state.app
    };
    
}


export default connect(
    mapStateToProps,
    (dispatch) => {
        return { vote, comment, dispatch }
    }
)(Comments);
