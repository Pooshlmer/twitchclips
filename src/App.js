import React from 'react';
import API from './api.js';
import './App.css';

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

  // On page start check if this is a return with the access token
  constructor(props) {
    super(props);
    let authToken = null;
    let api = null;
    if (document.location.hash !== "") {
      let re = /access_token=([^&]+)/;
      authToken = re.exec(document.location.hash)[1];
      api = new API(authToken);
    }
    this.state = {clips: [], clipdatas: [], api: api, user: null}
  }

  componentDidMount() {
    this.renderClips();
  }

  // Loads clips as an array of Clip objects
  renderClips = async() => {

    let clipData = null;
    let user = null;
    let follows = null;
    if (this.state.api !== null) {
      user = await this.state.api.getUser();
      follows = await this.state.api.getFollows(user.data.data[0].id);
      clipData = await this.state.api.getAllClips(follows.data.data);
    }
    
    console.debug(clipData);

    let clipdatas = [];
    let clips = [];

    // If not logged in use oauth to get the user profile
    if (clipData === null) {
      clips.push(<a key="loginlink" href={API.getLoginLink()}>Login to Twitch to see Clips</a>);

    } else {
      for (let result of clipData) {
        if (result.status === "fulfilled") {
          for (let clip of result.value.data.data) { 
            clipdatas.push(clip);
            //clips.push(<Clip key={clip.id} clipdata={clip}/>);
          }
        } else {
          console.error(result.reason);
        }  
      }

      clipdatas.sort((a, b) => {
        return (b.view_count - a.view_count);
      });

      for(let clip of clipdatas) {
        clips.push(<Clip key={clip.id} clipdata={clip}/>);
      }

      this.setState({
        clipdatas: clipdatas,
        clips: clips,
        user: user
      })
    }


    
  }

  render () {
    return (<div className="clipOuterDiv">{this.state.clips}</div>);
  }
}

export default App;
