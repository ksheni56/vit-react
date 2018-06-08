import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import 'moment-timezone';
import steem from 'steem';

import axios from 'axios';
import reducers from './reducers';

// Styling
import './sass/bootstrap.scss';
import './sass/App.scss';
import './sass/Select.scss';
import './sass/video/video-react.scss';
import './sass/Header.scss';
import './sass/LeftSidebar.scss';
import './sass/Item.scss';
import './sass/Upload.scss';
import './sass/Post.scss';
import './sass/Channel.scss';


// Components
import Bootstrap from './Bootstrap';
import Home from './Home';
import Tag from './Tag';
import Post from './Post';
import Login from './Login';
import Channel from './Channel';
import Upload from './Upload';
import Categories from './Categories';

// Add Steem
steem.api.setOptions({ url: 'https://api.steemit.com'});

ReactDOM.render((
    <Provider store={reducers}>
        <Router>
            <Switch>

                <Route exact path="/login" component={ Login } /> 
                
            	<Bootstrap>
            

                    <Route 
                        exact
                        path="/:filter?" 
                        render={ props => { 

                            var test_if_home = /trending|new|hot|promoted/.test(props.location.pathname);
                            var test_if_channel = /@/.test(props.location.pathname);
 
                            if(test_if_home) return <Home {...props} /> 
                            else if(props.location.pathname == '/upload') return <Upload {...props} />
                            else if(props.location.pathname == '/categories') return <Categories {...props} />
                            else if(test_if_channel) return <Channel {...props} />
                            else return <Redirect to="/trending/"/>

                        } } 
                    />
                    
                    <Route 
                        path="/:tag/:filter" 
                        render={ props => { 
                            
                            var test_if_post = /@/.test(props.location.pathname);
                            if(!test_if_post) return <Tag {...props} />
                            else return null;

                        } }
                    /> 
                    <Route path="/@:author/:permalink" component={ Post } /> 

                	                    

                </Bootstrap> 

            </Switch>
        </Router>
    </Provider> 
), document.getElementById('root'));