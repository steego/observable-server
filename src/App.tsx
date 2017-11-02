import * as React from 'react';
import './App.css';

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
  constructor() {
    super();
  }

  createSocket = () => {
    if (!canUseDOM) { return; }
    let socket = new WebSocket(socketAddress);
    this.updateState({ Message: 'Connected!' });

    socket.onmessage = (message) => {
      this.updateState({ Message: message.data });
    };

    socket.onclose = (x) => {
      this.updateState({ Message: 'Connection closed...  Will try to restart.' });

      setTimeout(this.createSocket, 1000);
    };

  }

  componentWillMount() {
    this.createSocket();
  }



  render() {
    let message = tryParse(this.state.Message);

    return (
      <div className="App">
        <AppHeader title="Welcome to React!!" />

        <Grid value={message} />
      </div>

    );
  }

  updateState = (newState: AppState) => {
    this.setState(newState);
  }

}

let tryParse = (json: string) => {
  try {
    return JSON.parse(json);
  } catch (exn) {
    return null;
  }
};

// tslint:disable-next-line:no-any
let Grid = (props: { value: any }): JSX.Element => {
  let value = props.value;
  if (value == null) {
    return (<div>null</div>);
  } else if (typeof value === 'string' || typeof value === 'number') {
    return (<div>{value}</div>);
  } else if (Array.isArray(value)) {
    return (
      <table className="table-bordered">
        {value.map(p =>
          <tr key={p}>
            <td><Grid value={value[p]} /></td>
          </tr>)}
      </table>
    );
  // } else if (value.type != null) {
  //     return MyElement(value);
  } else {
    let properties = Object.getOwnPropertyNames(value);
    // let json = JSON.stringify(properties);
    return (
      <table className="table-bordered">
        {properties.map(p =>
          <tr key={p}>
            <th>{p}</th>
            <td><Grid value={value[p]} /></td>
          </tr>)}
      </table>
    );
  }
};

// interface JSXElement {
//   type: string;
//   key: string;
//   // tslint:disable-next-line:no-any
//   props: Map<string, any>[];
// }

// let MyElement = (e: JSXElement) => React.createElement(e.type, e.props, ...e.props['children']);

let AppHeader = (props: { title: string }) =>
  (
    <div className="App-header">
      <h2>{props.title}</h2>
    </div>
  );

export default App;
