import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import 'moment-timezone';
import steem from '@steemit/steem-js';
import {
    API_URL,
    API_ADDRESS_PREFIX,
    API_CHAIN_ID
} from './config'
import reducers from './reducers';
import { getDMCAContents, getBlockedUsers } from './actions/app'

// Styling
import './sass/bootstrap.scss';
import './sass/App.scss';
import './sass/Select.scss';
import './sass/video/video-react.scss';
import './sass/Header.scss';
import './sass/LeftSidebar.scss';
import './sass/Item.scss';
import './sass/PreloadImage.scss'
import './sass/Upload.scss';
import './sass/Post.scss';
import './sass/Comment.scss';
import './sass/Channel.scss';
import './sass/Responsive.scss';

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
import Legal2257Statement from './Legal2257Statement';
import LegalPrivacyPolicy from './LegalPrivacyPolicy';
import ScrollToTop from './components/ScrollToTop ';

// Connect to Vit
steem.api.setOptions({
    url: API_URL,
    address_prefix: API_ADDRESS_PREFIX,
    chain_id: API_CHAIN_ID
});

// Fetch DMCA data
reducers.dispatch(getDMCAContents());
reducers.dispatch(getBlockedUsers());

ReactDOM.render((
    <Provider store={reducers}>
        <Router>
            <ScrollToTop>
            <Switch>

                <Route exact path="/login/:username?" component={ Login } />

            	<Bootstrap>


                    <Route
                        exact
                        path="/:filter?"
                        render={ props => {

                            var test_if_home = /trending|new|hot/.test(props.location.pathname);
                            var test_if_channel = /@/.test(props.location.pathname);

                            if(test_if_home) return <Home {...props} />
                            else if(props.location.pathname === '/upload') return <Upload {...props} />
                            else if(props.location.pathname === '/history') return <History {...props} />
                            else if(props.location.pathname === '/wallet') return <Wallet {...props} />
                            else if(props.location.pathname === '/transfers') return <Transfers {...props} />
                            else if(props.location.pathname === '/profile') return <Profile {...props} />
                            else if(props.location.pathname === '/categories') return <Categories {...props} />
                            else if(props.location.pathname === '/2257') return <Legal2257Statement {...props} />
                            else if(props.location.pathname === '/privacy') return <LegalPrivacyPolicy {...props} />
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
            </ScrollToTop>
        </Router>
    </Provider>
), document.getElementById('root'));
