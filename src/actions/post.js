import axios from 'axios';
import store from './../reducers';
import steem from 'steem';

export function vote(request) {

	return new Promise((resolve, reject) => {

		console.log("request", request)

		if(!request.postingWif) {

			reject({
	    		payload: 'Something went wrong'
	    	});

  			return;
		}
		
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