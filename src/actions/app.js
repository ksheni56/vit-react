import axios from 'axios';
import store from './../reducers';
import steem from 'steem';
//import Config from './../config.json';

export function loginUser(request) {   

    return new Promise((resolve, reject) => {

    	steem.api.getAccounts([request.username], (err, accounts) => {
			
	        if(accounts.length == 0) {

	        	reject({
	        		type: 'INVALID_ACCOUNT',
	        		payload: ["Accont doesn't exist"]
	        	})

	            return false;
	        }

	        let posting_key = accounts[0]['posting'].key_auths[0][0],
	            wif = steem.auth.toWif(request.username, request.password, ['posting']),
	            publicWif = steem.auth.wifToPublic(wif),
	            postingWif = wif;


	        if(posting_key == publicWif) {

	            resolve({
	        		type: 'LOGIN_USER',
	        		payload: {
	        			'username': request.username,
	        			'publicWif': publicWif,
	        			'postingWif': postingWif
	        		}
	        	})

	        } else {

	            reject({
	        		type: 'INVALID_PASSWORD',
	        		payload: ["Accont doesn't exist"]
	        	})

	        }
	        

	    });
    	
	});

}

export function restoreLogin(request) {

    return {
        type: 'LOGIN_USER',
        payload: request
    };

}

export function logout(request) {

	localStorage.removeItem('username');
    localStorage.removeItem('publicWif');

    return {
        type: 'LOGOUT',
        payload: []
    };

}