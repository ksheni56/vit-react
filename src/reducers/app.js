
const initialState = {
    "username": null,
    "publicWif": null,
    "authorized": false,
    "subs": []
};

export default function(state = initialState, action) {

    switch(action.type) {

        case 'LOGIN_USER':

            return Object.assign({}, state, {
                "username": action.payload.username,
                "publicWif": action.payload.publicWif,
                "postingWif": action.payload.postingWif,
                "authorized": true
            });

        case 'LOGOUT':

            return Object.assign({}, state, {
            	"username": null,
                "publicWif": null,
                "authorized": false
            });

        case 'UPDATE_USER':

            let UpdatedObject = action.payload,
                UserObject = Object.assign({}, state.user); // clone user object to work with

            for (var property in UpdatedObject) {
                UserObject[property] = UpdatedObject[property]; // update the keys from UpdatedObject only
            }

            return Object.assign({}, state, {
                user: UserObject
            });

        case 'GET_SUBS':
        
            return Object.assign({}, state, {
                subs: action.payload
            });

        default:
            return state;
    }

}