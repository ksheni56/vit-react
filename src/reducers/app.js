const initialState = {
    "username": null,
    "publicWif": null,
    "authorized": false
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

        break;

        case 'LOGOUT':

            return Object.assign({}, state, {
            	"username": null,
                "publicWif": null,
                "authorized": false
            });

        break;

        case 'UPDATE_USER':

            let UpdatedObject = action.payload,
                UserObject = Object.assign({}, state.user); // clone user object to work with

            for (var property in UpdatedObject) {
                UserObject[property] = UpdatedObject[property]; // update the keys from UpdatedObject only
            }

            return Object.assign({}, state, {
                user: UserObject
            });

        break;


        default:
            return state;
    }

}