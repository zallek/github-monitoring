import React from 'react';
import {Route} from 'react-router';

import HomeHandler from 'handlers/HomeHandler';
import IssueStatusHandler from 'handlers/IssueStatusHandler';

// declare our routes and their hierarchy
let routes = (
  <Route handler={HomeHandler} path="/">
    <Route path="issue/:id" handler={IssueStatusHandler}/>
  </Route>
);

export default routes;
