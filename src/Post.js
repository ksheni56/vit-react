import React, { Component } from 'react';
import { connect } from 'react-redux';
import steem from 'steem';
import { Player, BigPlayButton } from 'video-react';
import { NavLink, Link } from 'react-router-dom';
import { vote } from './actions/post';

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

        if(nextProps.match.params.permalink != this.state.permalink) {

            this.loadContent(nextProps.match.params.author, nextProps.match.params.permalink)

        }

    }

    componentDidMount() {

        this.loadContent(this.props.match.params.author, this.props.match.params.permalink)

    }

    getVotes(votes) {

        if(votes) {
            return (
                <button disabled={this.state.voting} onClick={() => this.castVote()} className="btn btn-danger btn-sm"><i className="fa fa-thumbs-up"></i> Like <span className="votes">{votes.length}</span></button>
            )
        }
        
    }

    castVote() {

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


    loadContent(author, permalink) {

        steem.api.getContent(author, permalink, (err, result) => {

            let post = result;

            console.log("Got post", post)

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

    displayPayoutAmount(amount) {
        if(amount) return parseInt(amount.replace(' SBD','')).toFixed(2);
    }

    render() {
        
        return (
            <div className="row justify-content-center mt-3">
                <div className="col-9 video-post">
                    <Player
                        playsInline
                        src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4"
                    >
                        <BigPlayButton position="center" />
                    </Player>

                    {
                        !this.state.loading ? (
                            
                            <span>
                                <div className="row video-info">
                                    <div className="col-9">
                                        <h2>{ this.state.post.title }</h2>
                                    </div>
                                    <div className="col-3 text-right amount">
                                        { this.getVotes(this.state.post.active_votes) }
                                    </div>
                                </div>
                                <div className="row video-meta align-items-center">
                                    <div className="col-6 author">
                                        <div className="d-flex author-card-wrapper align-items-center">
                                            <div className="avatar-holder">

                                                <img className="rounded-circle" src={ this.state.post.author_profile.json_metadata.profile.profile_image }/>

                    
                                            </div>
                                            <div className="data-holder">
                                                <div className="channel-name">{ this.state.post.author }</div>
                                                <button className="btn btn-sm btn-danger">Subscribe</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6 meta text-right">
                                        ${ this.displayPayoutAmount(this.state.post.pending_payout_value) }
                                    </div>
                                </div>
                            </span>

                        ) : (
                            <div className="row w-100 h-100 justify-content-center mt-5">
                                <div className="loader">Loading...</div>
                            </div>
                        )
                    
                    }

                </div>
                <div className="col-3 related-videos pl-0">
                    <h3>Related Videos</h3>

                    {
                        !this.state.loading_related ? (
                            
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

                        ) : (
                            <div className="row w-100 h-100">
                                
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


export default connect(mapStateToProps, { vote })(Post);
