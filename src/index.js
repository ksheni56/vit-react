import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import 'moment-timezone';
import steem from 'steem';

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

import 'react-toastify/dist/ReactToastify.css';


// Components
import Bootstrap from './Bootstrap';
import Home from './Home';
import Tag from './Tag';
import Post from './Post';
import Login from './Login';
import Channel from './Channel';
import Upload from './Upload';
import History from './History';
import Categories from './Categories';
import Wallet from './Wallet';
import Profile from './Profile';
import Transfers from './Transfers';

// Add Steem
//steem.api.setOptions({ url: 'https://api.steemit.com'});

// Connect to Vit Testnet

/*
steem.api.setOptions({
    url: 'https://peer.vit.tube/',
    address_prefix: "VIT",
    chain_id: "73f14dd4b7b07a8663be9d84300de0f65ef2ee7e27aae32bbe911c548c08f000"
});
*/

steem.api.setOptions({
    url: 'https://peer.proto.vit.tube',
    address_prefix: "WIT",
    chain_id: "1d50f6bcf387a5af6ebac42146ef920aedb5cc61d8f8ed37fb1ac671d722a302"
});

ReactDOM.render((
    <Provider store={reducers}>
        <Router>
            <Switch>

                <Route exact path="/login/:username?" component={ Login } /> 
                
            	<Bootstrap>
            

                    <Route 
                        exact
                        path="/:filter?" 
                        render={ props => { 

                            var test_if_home = /trending|new|hot|promoted/.test(props.location.pathname);
                            var test_if_channel = /@/.test(props.location.pathname);
 
                            if(test_if_home) return <Home {...props} /> 
                            else if(props.location.pathname === '/upload') return <Upload {...props} />
                            else if(props.location.pathname === '/history') return <History {...props} />
                            else if(props.location.pathname === '/wallet') return <Wallet {...props} />
                            else if(props.location.pathname === '/transfers') return <Transfers {...props} />
                            else if(props.location.pathname === '/profile') return <Profile {...props} />
                            else if(props.location.pathname === '/categories') return <Categories {...props} />
                            else if(test_if_channel) return <Channel {...props} />
                            else return <Redirect to="/new/"/>

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
