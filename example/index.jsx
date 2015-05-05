
import React from 'react';

import IssueStatus from 'components/IssueStatus';

React.render(
  <IssueStatus
    issue={{
      id: "14",
      user: "user",
      project: "project",
    }}
    displayDepedencies={true}
  />
, document.getElementById('container'));
