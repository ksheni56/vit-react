import axios from 'axios';
import store from './../reducers';
import steem from 'steem';
//import Config from './../config.json';


export function loginUser(request) {   

    return new Promise((resolve, reject) => {

    	steem.api.getAccounts([request.username], (err, accounts) => {

    		if(err) {

    			reject({
	        		type: 'INVALID_ACCOUNT',
	        		payload: ["Account doesn't exist"]
	        	})

	            return false;
    		}
			
	        if(accounts.length == 0) {

	        	reject({
	        		type: 'INVALID_ACCOUNT',
	        		payload: ["Account doesn't exist"]
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

export function subscribe(request) {

	return new Promise((resolve, reject) => {

		console.log("subscribe request", request)

		if(!request.postingWif) {

			reject({
	    		payload: 'Something went wrong. Most likely not logged in.'
	    	});

  			return;
		}

		var json = JSON.stringify(
		    ['follow', {
		      	follower: request.username,
		      	following: request.following,
		      	what: ['blog']
		    }]
		);

		steem.broadcast.customJson(
		    request.postingWif,
		    [],
		    [request.username],
		    'follow',
		    json,
		    (err, result) => {
		      	console.log(err, result);

		      	if(err) {

	      			reject({
			    		payload: err
			    	});

	      			return;
	      			
	      		}

	      		resolve({
	        		type: 'FOLLOW_SUCCESS',
	        		payload: result
	        	});

		    }
		);
    	
	});

}

export function unsubscribe(request) {

	return new Promise((resolve, reject) => {

		console.log("unsubscribe request", request)

		if(!request.postingWif) {

			reject({
	    		payload: 'Something went wrong. Most likely not logged in.'
	    	});

  			return;
		}

		var json = JSON.stringify(
		    ['follow', {
		      	follower: request.username,
		      	following: request.following,
		      	what: []
		    }]
		);

		steem.broadcast.customJson(
		    request.postingWif,
		    [],
		    [request.username],
		    'follow',
		    json,
		    (err, result) => {
		      	console.log(err, result);

		      	if(err) {

	      			reject({
			    		payload: err
			    	});

	      			return;
	      			
	      		}

	      		resolve({
	        		type: 'UNFOLLOW_SUCCESS',
	        		payload: result
	        	});

		    }
		);
    	
	});

}


export function getSubs(request) {   

    return new Promise((resolve, reject) => {

    	steem.api.getFollowing('sundaybaking', 0, 'blog', 10, (err, result) => {

            resolve({
        		type: 'GET_SUBS',
        		payload: result
        	});

        });


    	
	});

}