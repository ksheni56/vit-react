import { combineReducers, createStore, applyMiddleware } from 'redux';
import promise from 'redux-promise';

import AppReducer from './app';
import UsersReducer from './users';
import SearchReducer from './search';

const rootReducer = combineReducers({
    app: AppReducer,
    users: UsersReducer,
    search: SearchReducer
});

const createStoreWithMiddleware = applyMiddleware(promise)(createStore);

export default createStoreWithMiddleware(rootReducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
