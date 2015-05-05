import React from 'react';
import {RouteHandler} from 'react-router';


let HomeHandler = React.createClass({

  displayName: 'HomeHandler',

  render() {
    return (
      <div className="content">
        <h1>Github monitoring</h1>
        <RouteHandler/>
      </div>
    );
  },

});

export default HomeHandler;
