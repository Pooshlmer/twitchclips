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

class DateSelect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {dateRange: props.dateRange};

    this.handleChange = this.handleChange.bind(this);
    this.onChange = props.onChange;
  }

  handleChange(event) {
    this.setState({dateRange: event.target.value});
    this.onChange(event.target.value);
  }

  render() {
    return (
      <label>
        Filter by:
        <select value={this.state.dateRange} onChange={this.handleChange}>
          <option value="1">24H</option>
          <option value="7">7D</option>
          <option value="30">30D</option>
          <option value="0">All</option>
        </select>
      </label>
    );
  }
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
    this.state = {clips: [<div>Loading clips...please wait</div>], clipdatas: [], api: api, user: null, dateRange: 1}

    this.handleDateChange = this.handleDateChange.bind(this);
  }

  handleDateChange(value) {
    this.setState({dateRange: value, clips: [<div>Loading clips...please wait</div>], clipdatas: []});
    this.renderClips();
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
      clipData = await this.state.api.getAllClips(follows.data.data, parseInt(this.state.dateRange));
    }
    
    console.debug(clipData);

    let clipdatas = [];
    let clips = [];

    // If not logged in use oauth to get the user profile
    if (clipData === null) {
      clips.push(<a key="loginlink" href={API.getLoginLink()}>Login to Twitch to see Clips</a>);
      this.setState({
        clips: clips,
      })

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

      if (clipdatas.length === 0) {
        clips.push(<div>There are no clips from your follows that meet the specified criteria.</div>)
      }

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
    return (
      <div>
        <div><DateSelect dateRange={this.state.dateRange} onChange={this.handleDateChange} /></div>
        <div className="clipOuterDiv">{this.state.clips}</div>
      </div>
    );
  }
}

export default App;
