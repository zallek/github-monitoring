
import React from 'react';

import IssueStatus from 'components/IssueStatus';

React.render(
  <IssueStatus
    repository={{
      user: "user",
      project: "project",
    }}
    issue={{
      id: "14",
    }}
    displayDepedencies={true}
  />
, document.getElementById('container'));
