import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import moment from 'moment'
import Formsy from 'formsy-react';
import TextArea from './forms/TextArea';
import TextField from './forms/TextField';
import { vote, comment } from '../actions/post';
import { Promise } from 'bluebird';


class Comments extends Component {
    constructor(props) {
        super(props);

        this.state = {
            author: this.props.matchParams.author,
            permalink: this.props.matchParams.permalink,
            loading_comments: true,
            commenting: false,
            comments: [],
            post: this.props.post
            // related: [],
            // currentReplyForm: "",
            // nestedComments: []
        }

        this.submitComment = this.submitComment.bind(this);
        this.changeValue = this.changeValue.bind(this);
    }

    componentDidMount() {

        this.loadComments();

        // this.props.dispatch({
        //     type: 'START_BACKGROUND_SYNC_COMMENTS',
		//     callback: () => {
        //         console.log("Syncing comments on " + this.state.permalink);
        //         this.loadComments();
        //     },
        // });

    }

    componentWillUnmount() {
        // this.props.dispatch({
        //     type: 'STOP_BACKGROUND_SYNC_COMMENTS',
        // });
    }

    // toggleReply(Comment) {
    //     //console.log(Comment.author, Comment.permlink);
    //     this.setState({
    //         currentReplyForm: Comment.permlink
    //     })
    // }

    // submitNestedComment(form) {
    //     // console.log(form.nestedComment)
    //     // console.log(form.commentAuthorPermLink);
    //     const commentAuthorAndPermLink = form.commentAuthorPermLink;
    //     const [author, permlink] = commentAuthorAndPermLink.split("|");

    //     if(!this.props.app.authorized) {
    //         this.props.history.push("/login");
    //         return false;
    //     }

        
    //     this.setState({
    //         commenting: true
    //     });

    //     this.props.comment({

    //         postingWif: this.props.app.postingWif,
    //         username: this.props.app.username, 
    //         author: author,
    //         permalink: permlink,
    //         comment: form.nestedComment

    //     }).then( response => {

    //         console.log("comment submit success", response);

    //         console.log(this.state.comments);

    //         // this.state.comments.unshift({
    //         //     id: new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase(),
    //         //     author: response.payload.operations[0][1].author,
    //         //     body: response.payload.operations[0][1].body,
    //         //     created: new Date()
    //         // })

    //         this.setState({
    //             commenting: false
    //         });


    //     }).catch(err => {

    //         console.log("comment submit error", err)

    //         this.setState({
    //             commenting: false
    //         });

    //     });
    // }

    // loadNestedComments(author, permalink) {
    //     steem.api.getContentReplies(author, permalink, (err, result) => {

    //         if(err) {
                
    //             this.setState({
    //                 loading_comments: false,
    //                 nestedComments: []
    //             });
                
    //             return false;

    //         }
    //         console.log(result);
    //         this.setState({
    //             loading_comments: false,
    //             nestedComments: result
    //         });

    //     });
    // }

    changeValue(event) {

    }
     

    submitComment(form) {
        if(!this.props.app.authorized) {
            this.props.history.push("/login");
            return false;
        }

        
        // determine whether to reply for post or comment
        // TODO: plan to use this function both commenting on post or sub comment
        // by using onChange, but it didn't work

        this.setState({
            commenting: true
        });

        this.props.comment({
            postingWif: this.props.app.postingWif,
            username: this.props.app.username, 
            author: this.state.author,
            permalink: this.state.permalink,
            comment: form.comment
        }).then( response => {
            console.log("comment submit success", response);

            this.state.comments.unshift({
                id: new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase(),
                author: response.payload.operations[0][1].author,
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

    // render Comment Input Box
    renderCommentBox() {
        return (
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

                        <button type="submit" className="btn btn-danger" disabled={this.state.commenting || this.state.submitting}>Submit</button>
                    </Formsy>
                </div>
            </div>
        )   
    }

    // load list of comments related to post
    loadComments() {

        let fetchReplies = function (author, permlink) {

            return new Promise((resolve, reject) => {
                steem.api.getContentReplies(author, permlink, (err, result) => {
                    let reply = Promise.map(result, function(r) {
                        if (r.children > 0) {
                            return fetchReplies(r.author, r.permlink)
                                    .then(function(children) {
                                        r.replies = children;
                                        return r;
                                    })
                        } else {
                            return r;
                        }
                    })
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
                <ul className="list-unstyled">
                    { 
                    this.state.comments.map(
                        (Comment) =>
                            <li key={ Comment.id } ref={ Comment.id } className="media mb-4">
                                <div className="mr-3 avatar"></div>
                                <div className="media-body">
                                    <h5 className="mt-0 mb-1">{ Comment.author }</h5>
                                    <span>{ Comment.body }</span>
                                    <div className="text-muted small d-flex align-items-center comment-meta"> 
                                        {/* TODO: Modify getVosts as get whether comments are voted or not */}
                                        { moment.utc(Comment.created).tz( moment.tz.guess() ).fromNow() } &middot; <button onClick={() => this.props.castVote(Comment.permlink, Comment.author, "comment")} className="btn btn-link btn-sm px-0">Like</button>
                                        {/* { moment.utc(Comment.created).tz( moment.tz.guess() ).fromNow() } &middot; <button className="btn btn-link btn-sm px-0">Like</button> */}
                                        &middot; 
                                        {/* <button onClick={() => this.toggleReply(Comment)} className="btn btn-link btn-sm px-0">Reply</button> */}
                                    </div>

                                    {/* check and render the nested comments if any */}
                                    {
                                        Comment.children > 0 ? (
                                            <ul>
                                                {this.renderNestedComments(Comment.replies)}
                                            </ul>
                                        ) : null
                                    }

                                    {/*  */}
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
            if (comment.children > 0 ) {
                return (
                    <li>
                        <ul>
                            {this.renderNestedComments(comment)}
                        </ul>
                    </li>
                )
            } else {
                return (
                    <li key={comment.id} className="media mb-4">
                        <div className="mr-3 avatar"></div>
                        <div className="media-body">
                            <h6 className="mt-0 mb-1">{comment.author}</h6>
                            <span>{comment.body}</span>
                            <div className="text-muted small d-flex align-items-center comment-meta"> 
                                { moment.utc(comment.created).tz( moment.tz.guess() ).fromNow() } &middot; <button className="btn btn-link btn-sm px-0">Like</button>
                                &middot; 
                                <button className="btn btn-link btn-sm px-0">Reply</button>
                            </div>
                        </div>
                    </li>
                )
            }
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
                {this.renderCommentBox()}

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