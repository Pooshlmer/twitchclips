import React from 'react';
import axios from 'axios';
import QueryString from 'query-string';
import logo from './logo.svg';
import './App.css';
import * as constants from './secret.js';

function Clip ({clipdata}) {
  return (
    <div className="clip">
      <a href={clipdata.url}>
        <img alt={clipdata.title} src={clipdata.thumbnail_url} />
        <div className="cliptitle"><strong>{clipdata.title}</strong></div>
      </a>
      <div>{clipdata.broadcaster_name}</div>
      <div>Clipped by {clipdata.creator_name}</div>
      <div>{clipdata.view_count} views</div>
    </div>
  );
}

class App extends React.Component {

  constructor(props) {
    super(props);
    let authToken = null;
    if (document.location.hash !== "") {
      let re = /access_token=([^&]+)/;
      authToken = re.exec(document.location.hash)[1];
    }
    this.state = {clips: [], auth_token: authToken}
  }

  async getToken() {
    
    if (this.state.auth_token !== null) {
      // TODO: Check if token is valid
      return this.state.auth_token;
    } else {
      return null;
    }
  }

  async getClips() {

    let url = 'https://api.twitch.tv/helix/clips';

    let authtoken = await this.getToken();

    console.log(authtoken);

    if (authtoken === null) {
      return null;
    }
    
    let headers = {
      'Client-ID' : constants.TWITCH_CLIENT_ID,
      'Authorization' : 'Bearer ' + authtoken,
    };

    let start_date = new Date();
    start_date.setDate(start_date.getDate() - 1);

    let params = {
      game_id : 509658, 
      started_at: start_date.toISOString(),
      first: 100,
    };

    let options = {
      headers: headers,
      params: params,
    }

    return axios.get(url, options);
  }

  componentDidMount() {
    this.renderClips();
  }

  renderClips = async() => {

    let clipData = await this.getClips();

    let clips = [];

    if (clipData === null) {
      
      let url = 'https://id.twitch.tv/oauth2/authorize';

      let params = {
        client_id: constants.TWITCH_CLIENT_ID,
        redirect_uri: 'http://localhost:3000',
        response_type: 'token',
        scope: 'user:read:email',
        // TODO: make into random string
        state: constants.SESSION_SECRET,
      }

      let qString = QueryString.stringify(params);

      clips.push(<a key="loginlink" href={url + '?' + qString}>Login to Twitch to see Clips</a>);

    } else {

    //console.log(clipData);

      for (let clipDatum of clipData.data.data) {
        clips.push(<Clip key={clipDatum.id} clipdata={clipDatum} />);
      }
    }


    this.setState({
      clips: clips,
    });
  }

  render () {
    return (<div className="clipOuterDiv">{this.state.clips}</div>);
  }
}

export default App;
