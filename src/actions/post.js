import axios from 'axios';
import store from './../reducers';
import steem from 'steem';

export function vote(request) {

	return new Promise((resolve, reject) => {

		console.log("request", request)

		//var wif = steem.auth.toWif('sundaybaking', 'P5J5PDHb75B4csokAyX1UhR9UVVsvbXMaYXx49WseyX86Z1KeqQx', 'posting');

		//console.log("wif", wif)
		
		steem.broadcast.vote(
	    	request.postingWif,
	    	request.username,
	    	request.author, 
	    	request.permalink,
	    	request.weight,
	    	(err, result) => {
	      		console.log(err, result);

	      		if(err) {

	      			reject({
			    		payload: err
			    	});

	      			return;
	      			
	      		}

	      		resolve({
	        		type: 'VOTE_SUCCESS',
	        		payload: result
	        	});

	    	}
	  	);
	  	
    	
	});

}