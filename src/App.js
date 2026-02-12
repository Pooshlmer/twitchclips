import React from 'react';
import { instanceOf } from 'prop-types';
import QueryString from 'query-string';
import { withCookies, Cookies } from 'react-cookie';
import API from './api.js';
import './App.css';

function Clip({ clipdata }) {
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

    this.state = { dateRange: props.dateRange };

    this.handleChange = this.handleChange.bind(this);
    this.onChange = props.onChange;
  }

  handleChange(event) {
    this.setState({ dateRange: event.target.value });
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

  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  // On page start check if this is a return with the access token
  constructor(props) {
    super(props);

    //const { cookies } = props;
    let authToken = null;
    let api = null;
    // If this is a redirection from a successful login get the auth token from the url
    if (document.location.hash !== "") {
      let query = QueryString.parse(document.location.hash);

      let state = sessionStorage.getItem('state');
      if (query.state === state) {
        authToken = query.access_token;
        api = new API(authToken);
        sessionStorage.removeItem('state');
      } else {
        console.error('State does not match!');
      }
    }
    this.state = {
      clips: [<div>Loading clips...please wait</div>], api: api, dateRange: 1,
      clipdatas0: null,
      clipdatas1: null,
      clipdatas7: null,
      clipdatas30: null,
      clipexpire0: null,
      clipexpire1: null,
      clipexpire7: null,
      clipexpire30: null,
    };

    this.handleDateChange = this.handleDateChange.bind(this);
  }

  resetToLogin() {

    let clips = [<a key="loginlink" href={API.getLoginLink()}>Login to Twitch to see Clips</a>];
    this.setState({
      clips: clips,
    })
  }

  handleDateChange(value) {
    let newState = { dateRange: value, clips: [<div>Loading clips...please wait</div>] }
    this.setState(newState);
    this.renderClips(value);
  }

  componentDidMount() {
    this.renderClips(1);
  }

  // Loads clips as an array of Clip objects
  renderClips = async (value) => {

    let usingCache = false;
    let clipData = null;
    let user = null;
    let follows = null;

    const { cookies } = this.props;

    if (this.state.api !== null) {
      try {
        let expireDate = new Date();
        expireDate.setHours(expireDate.getHours() - 1);
        let cacheDate = this.state['clipexpire' + value];
        if (cacheDate != null && cacheDate > expireDate) {
          clipData = this.state['clipdatas' + value];
          usingCache = true;
        } else {
          let userId = null;
          // Can save an api call using cookies
          if (cookies.get('userId') !== undefined) {
            userId = cookies.get('userId');
          } else {
            user = await this.state.api.getUser();
            if (user.status !== 200) {
              this.resetToLogin();
              return;
            }
            userId = user.data.data[0].id;
            cookies.set('userId', userId, { secure: true, sameSite: 'strict' });

          }
          follows = await this.state.api.getFollows(userId);
          if (follows.status !== 200) {
            this.resetToLogin();
            return;
          }
          clipData = await this.state.api.getAllClips(follows.data.data, parseInt(value));
        }
      } catch (e) {
        console.log(e);
      }
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
      if (usingCache) {
        for (let clip of clipData) {
          clipdatas.push(clip);
        }
      } else {
        for (let result of clipData) {
          //console.debug(result);
          if (result.status === "fulfilled") {
            for (let clip of result.value.data.data) {
              clipdatas.push(clip);
              //clips.push(<Clip key={clip.id} clipdata={clip}/>);
            }
          } else {
            console.error(result.reason);
          }
        }
      }

      clipdatas.sort((a, b) => {
        return (b.view_count - a.view_count);
      });

      if (clipdatas.length === 0) {
        clips.push(<div>There are no clips from your follows that meet the specified criteria.</div>)
      }

      for (let clip of clipdatas) {
        clips.push(<Clip key={clip.id} clipdata={clip} />);
      }

      let newstate = { clips: clips };
      if (!usingCache) {
        newstate['clipdatas' + value] = clipdatas;
        newstate['clipexpire' + value] = Date.now();
      }
      this.setState(newstate);
    }
  }

  render() {
    return (
      <div>
        <div><DateSelect dateRange={this.state.dateRange} onChange={this.handleDateChange} /></div>
        <div className="clipOuterDiv">{this.state.clips}</div>
      </div>
    );
  }
}

export default withCookies(App);
