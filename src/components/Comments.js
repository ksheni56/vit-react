import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from '@steemit/steem-js';
import { Link } from 'react-router-dom';
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
            const depth = 0;
            return (
                <div className="post-comments-content">
                    { 
                    this.state.comments.map(
                        (Comment) =>
                            <div className="Comment" key={Comment.id}>
                                <div className=" d-flex">
                                    <div className="Comment__Userpic">
                                        <Link to={ "/@" + Comment.author } >
                                        <Avatar 
                                            profile_image={AVATAR_UPLOAD_PREFIX + Comment.author + "/avatar"} 
                                        />
                                        </Link>
                                    </div>
                                    <div className="Comment__Content flex-fill">
                                        <div className="Comment__header">
                                            <Link to={ "/@" + Comment.author }  className="Comment__header-user">
                                                { Comment.author }
                                            </Link>
                                        </div>
                                        <div className="Comment__body entry-content">
                                            <span>{ Comment.body }</span>
                                        </div>
                                        <div className="Comment__footer">
                                            <div>
                                                <span className="Comment__footer__controls">
                                                    <div className="text-muted small d-flex align-items-center comment-meta"> 
                                                        {this.props.getVotes(Comment, "comment")} &nbsp;| {Comment.net_votes} Votes
                                                        | <button className="btn btn-link btn-sm px-0 reply-button" onClick={() => this.setReplyTarget([Comment.author, Comment.permlink].join('|'))}>Reply</button>
                                                    </div>

                                                    {   
                                                        this.props.currentVote === Comment.permlink && (
                                                            this.props.renderVoteSlider(Comment.permlink, Comment.author, 'comment')
                                                        )
                                                    }
                                                    
                                                </span>
                                            </div>  

                                            {/* render comment box if matched */}
                                            { 
                                                this.state.replyTarget === [Comment.author, Comment.permlink].join('|') && (
                                                    this.renderCommentBox(false)
                                                )
                                            }

                                        </div>
                                    </div>
                                </div>

                                {/* check and render the nested comments if any */}
                                {
                                    Comment.children > 0 ? (
                                        <div className="Comment__replies" key={Comment.id}>
                                            {this.renderNestedComments(Comment.replies, depth + 1)}
                                        </div>
                                    ) : null
                                }
                            </div>
                        )
                    }
                </div>
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
    renderNestedComments(subComments, depth) {
        
        const depth_indicator = [];
        if (depth >= 1) {
            for (let i = 1; i <= depth; ++i) {
                depth_indicator.push(
                    <div key={i} className={`depth di-${i}`}>
                        &nbsp;
                    </div>
                );
            }
        }

        let lists = subComments.map(comment => {
            return (
                <div className="Comment reply" key={comment.id}>
                    {/* {depth_indicator} */}
                    <div className=" d-flex">
                        <div className="Comment__Userpic">
                            <Link to={ "/@" + comment.author } >
                            <Avatar 
                                profile_image={AVATAR_UPLOAD_PREFIX + comment.author + "/avatar"} 
                            />
                            </Link>
                        </div>
                        <div className="Comment_Content flex-fill">
                            <div className="Comment__header">
                                <Link to={ "/@" + comment.author } className="Comment__header-user">
                                    { comment.author }
                                </Link>
                            </div>
                            <div className="Comment__body entry-content">
                                <span>{ comment.body }</span>
                            </div>
                            <div className="Comment__footer">
                                <div>
                                    <span className="Comment__footer__controls">
                                        <div className="text-muted small d-flex align-items-center comment-meta"> 
                                            {this.props.getVotes(comment, "comment")} &nbsp;| {comment.net_votes} Votes
                                            | <button className="btn btn-link btn-sm px-0 reply-button" onClick={() => this.setReplyTarget([comment.author, comment.permlink].join('|'))}>Reply</button>
                                        </div>
                                        {   
                                            this.props.currentVote === comment.permlink && (
                                                this.props.renderVoteSlider(comment.permlink, comment.author, 'comment')
                                            )
                                        }

                                    </span>
                                </div>  

                                {/* render comment box if matched */}
                                { 
                                    this.state.replyTarget === [comment.author, comment.permlink].join('|') && (
                                        this.renderCommentBox(false)
                                    )
                                }
                            </div>
                        </div>
                    </div>
                        {/* check and render the nested comments if any */}
                        {
                            comment.children > 0 ? (
                                <div className="Comment__replies" key={comment.id}>
                                    {this.renderNestedComments(comment.replies, depth + 1)}
                                </div>
                            ) : null
                        }
                </div>
            )
        })

        return lists;        
    }

    renderComments() {
        
        return (
            (!this.state.loading_comments) ? (
                <div className="row mt-3">
                    <div className="col-12">
                        <h6>Comments <span>({this.state.comments.length})</span></h6>
                    </div>
                    <div className="col-12">
                        {this.displayComments()}
                    </div>
                </div>
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
