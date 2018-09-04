import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import promise from 'redux-promise';

import createSagaMiddleware from 'redux-saga';
import rootSaga from './../sagas/rootSaga';

import AppReducer from './app';
import UsersReducer from './users';
import SearchReducer from './search';
import UploadReducer from './upload'

const rootReducer = combineReducers({
    app: AppReducer,
    users: UsersReducer,
    search: SearchReducer,
    upload: UploadReducer
});

const saga = createSagaMiddleware();

const store = createStore(
    rootReducer,
    /* window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
      compose(
        // NOTE(svitx/2018-08-19):
        //   I'm not certain why this promise is needed, however the code will
        //   throw an exception if it is not present.
        applyMiddleware(promise),
        applyMiddleware(saga),
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__()
      ) : */
      compose(
        applyMiddleware(promise),
        applyMiddleware(saga),
      )
);

saga.run(rootSaga);

export default store;
