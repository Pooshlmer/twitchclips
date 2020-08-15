import axios from 'axios';
import QueryString from 'query-string';
import * as constants from './secret.js';

// Interfaces with the twitch API

export default class API {
  constructor(authtoken) {
    this.authtoken = authtoken;
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + authtoken;
    axios.defaults.headers.common['Client-ID'] = constants.TWITCH_CLIENT_ID;
  }

  // Get all clips from a user's followed streamers and categories
  async getAllClips(follows) {

    let url = 'https://api.twitch.tv/helix/clips';

    //console.log(this.authtoken);

    if (this.authtoken === null) {
      return null;
    }
    

    let start_date = new Date();
    start_date.setDate(start_date.getDate() - 1);

    let cliparray = [];

    for (let follow of follows) {
      let params = {
        broadcaster_id : follow.to_id, 
        started_at: start_date.toISOString(),
        first: 10,
      };
  
      let options = {
        params: params,
      }
  
      cliparray.push(axios.get(url, options));
    }

    return Promise.allSettled(cliparray)
  }

  async getUser() {
    let url = 'https://api.twitch.tv/helix/users';

    return axios.get(url);
  }

  async getFollows(user_id) {
    let url = 'https://api.twitch.tv/helix/users/follows';

    let params = {
      from_id: user_id,
      first: 100,
    }

    let options = {
      params: params,
    }

    return axios.get(url, options);
  }

  async getToken() {
    
    // TODO: Check if token is valid
    return this.authtoken;
  }

  static getLoginLink() {
    
    let url = this.TWITCH_LOGIN_LINK;

    let params = {
      client_id: constants.TWITCH_CLIENT_ID,
      redirect_uri: this.LOCALREDIRECT,
      response_type: 'token',
      scope: 'user:read:email',
      // TODO: make into random string
      state: constants.SESSION_SECRET,
    }

    let qString = QueryString.stringify(params);

    return (url + '?' + qString);
  }
}

API.TWITCH_LOGIN_LINK = 'https://id.twitch.tv/oauth2/authorize';
API.LOCALREDIRECT = 'http://localhost:3000';
API.TWITCH_GETUSER_LINK = 'https://api.twitch.tv/helix/users';