import * as React from 'react';
import './App.css';

const logo = require('./logo.svg');

let canUseDOM = !!(
  (typeof window !== 'undefined' &&
    window.document && window.document.createElement)
);

const socketAddress = 'ws://localhost:3001';

interface AppState {
  Message: string;
}

// tslint:disable-next-line:no-any
class App extends React.Component<{}, AppState> {
  private socket: WebSocket;

  constructor() {
    super();
  }

  createSocket = () => {
    let socket = new WebSocket(socketAddress);
    this.updateState({ Message: 'Connected!' });

    socket.onmessage = (message) => {
      this.updateState({ Message: message.data });
    };

    socket.onclose = (x) => {
      this.updateState({ Message: 'Connection closed...  Will try to restart.' });

      setTimeout(this.createSocket, 1000);
    };

    this.socket = socket;
  }

  componentWillMount() {
    this.createSocket();
  }

  render() {
    let message = this.state.Message;

    return (
      <div className="App">
        <AppHeader title="Welcome to React!!" />
        <Person name="Bob" />
        <p>Hello</p>

        <div>Can Use DOM: {canUseDOM ? 'Yes' : 'No'}</div>

        <div>
          Message: {message}
        </div>
      </div>

    );
  }

  updateState = (newState: AppState) => {
    this.setState(newState);
  }

}

let AppHeader = (props: { title: string }) =>
  (
    <div className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <h2>{props.title}</h2>
    </div>
  );

let Person = (props: { name: string }) =>
  <div>Name: {props.name}</div>;

export default App;
